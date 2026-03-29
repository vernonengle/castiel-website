#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# castiel-engle.com — one-time infrastructure bootstrap
# Run this with AWS admin credentials (not claude-cli).
# After this completes, everything else uses AWS_PROFILE=claude-castiel.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ACCOUNT_ID="828788451819"
DOMAIN="castiel-engle.com"
HOSTED_ZONE_ID="Z09985112EN35EV3NZ658"
REGION="ap-southeast-1"
CERT_REGION="us-east-1"   # ACM certs for CloudFront MUST be in us-east-1
STACK_NAME="castiel-iam"
SITE_STACK_NAME="castiel-engle-com"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Step 1: Create IAM policy + roles ==="
aws cloudformation deploy \
  --template-file "$SCRIPT_DIR/iam.yaml" \
  --stack-name "$STACK_NAME" \
  --capabilities CAPABILITY_NAMED_IAM \
  --no-fail-on-empty-changeset

echo ""
echo "=== Step 2: Update claude-cli assume-role policy ==="
echo "Add arn:aws:iam::${ACCOUNT_ID}:role/claude-castiel-deploy-role"
echo "to the claude-cli user's assume-role-policy in the AWS Console or via:"
cat <<'EOF'

  # Get current policy, add new role, update inline policy:
  aws iam put-user-policy \
    --user-name claude-cli \
    --policy-name assume-role-policy \
    --policy-document '{
      "Version":"2012-10-17",
      "Statement":[{"Effect":"Allow","Action":"sts:AssumeRole","Resource":[
        "arn:aws:iam::828788451819:role/claude-readonly-role",
        "arn:aws:iam::828788451819:role/claude-environment-cleanup-role",
        "arn:aws:iam::828788451819:role/claude-flip-seven-deploy-role",
        "arn:aws:iam::828788451819:role/claude-buzzer-deploy-role",
        "arn:aws:iam::828788451819:role/claude-castiel-deploy-role"
      ]}]}'
EOF

echo ""
echo "=== Step 3: Request ACM certificate in us-east-1 ==="
CERT_ARN=$(aws acm request-certificate \
  --domain-name "$DOMAIN" \
  --subject-alternative-names "www.$DOMAIN" \
  --validation-method DNS \
  --region "$CERT_REGION" \
  --tags Key=project,Value=castiel \
  --query "CertificateArn" --output text)
echo "Certificate ARN: $CERT_ARN"
echo ""
echo "⚠️  DNS validation required — add the CNAME records shown in ACM console."
echo "   The hosted zone is $DOMAIN ($HOSTED_ZONE_ID)."
echo "   Use 'aws acm describe-certificate --certificate-arn $CERT_ARN --region us-east-1' to see the CNAME."
echo ""
echo "   For Route 53 auto-validation, run:"
echo "   aws acm describe-certificate --certificate-arn $CERT_ARN --region us-east-1 --query 'Certificate.DomainValidationOptions'"
echo "   Then add the CNAME via Route 53."
echo ""
echo "   Wait until status is ISSUED before deploying the site stack."
echo "   Export for use below:"
echo "   export CERT_ARN=$CERT_ARN"

echo ""
echo "=== Step 4: (After cert is ISSUED) Deploy site CloudFormation stack ==="
cat <<EOF

  AWS_PROFILE=claude-castiel aws cloudformation deploy \\
    --template-file "$SCRIPT_DIR/static-site.yaml" \\
    --stack-name "$SITE_STACK_NAME" \\
    --region "$REGION" \\
    --parameter-overrides \\
        DomainName=$DOMAIN \\
        HostedZoneId=$HOSTED_ZONE_ID \\
        CertificateArn=\$CERT_ARN \\
    --no-fail-on-empty-changeset

EOF

echo ""
echo "=== Step 5: Sync site files to S3 ==="
cat <<EOF

  AWS_PROFILE=claude-castiel aws s3 sync \\
    $(dirname "$SCRIPT_DIR")/ \\
    s3://castiel-engle-com \\
    --exclude "infra/*" \\
    --exclude ".github/*" \\
    --exclude "*.sh" \\
    --delete

EOF

echo ""
echo "Bootstrap complete! Check outputs from the cloudformation deploy for the CloudFront distribution ID."
