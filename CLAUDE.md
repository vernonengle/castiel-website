# Castiel's Personal Website

Vernon's son Castiel's personal website at `castiel-engle.com`.
Plain HTML + CSS + JavaScript — no build tooling. Open `index.html` directly in a browser.

## Tech Stack
- **Frontend**: Plain HTML5 + CSS3 + Vanilla JavaScript (no build step)
- **Hosting**: S3 + CloudFront (private S3, OAC access)
- **DNS**: Route 53 (domain registered directly in AWS)
- **IaC**: CloudFormation (`infra/static-site.yaml`)
- **IAM bootstrap**: CloudFormation (`infra/iam.yaml`) — run ONCE with admin credentials

## Project Structure
```
castiel/
├── CLAUDE.md
├── index.html              ← single page, all sections
├── css/style.css           ← deep space + bioluminescent ocean theme
├── js/
│   ├── stars.js            ← animated starfield (Canvas, hero section)
│   ├── fractal.js          ← interactive Mandelbrot set (Canvas)
│   └── media.js            ← loads manifests, renders audio player + code viewer
├── music/
│   └── manifest.json       ← {tracks: [{title, description, file}]}
├── code/
│   └── manifest.json       ← {scripts: [{title, description, file}]}
├── assets/images/          ← placeholder for future images
├── infra/
│   ├── iam.yaml            ← IAM bootstrap (deploy ONCE with admin creds)
│   ├── static-site.yaml    ← S3 + CloudFront + Route 53
│   └── bootstrap.sh        ← step-by-step first-time setup script
└── .github/workflows/
    └── deploy.yml          ← GitHub Actions: lint + deploy on push to main
```

## AWS Resources
| Resource | Value |
|----------|-------|
| Domain | `castiel-engle.com` (Route 53 registered) |
| Hosted Zone | `Z09985112EN35EV3NZ658` |
| S3 Bucket | `castiel-engle-com` (ap-southeast-1, private + OAC) |
| CloudFront | TBD after deploy (see CloudFormation outputs) |
| ACM cert | TBD — request in us-east-1, DNS-validate via Route 53 |
| IAM role (Claude) | `claude-castiel-deploy-role` |
| IAM role (GitHub) | `github-actions-castiel-role` |
| CloudFormation stacks | `castiel-iam`, `castiel-engle-com` |

## AWS CLI Access
- **AWS_PROFILE**: `claude-castiel` (assumes `claude-castiel-deploy-role`)
- Role must be bootstrapped first — see `infra/bootstrap.sh`

## First-Time Deployment (run once)
```bash
# 1. Deploy IAM roles (needs admin credentials)
aws cloudformation deploy \
  --template-file infra/iam.yaml \
  --stack-name castiel-iam \
  --capabilities CAPABILITY_NAMED_IAM

# 2. Update claude-cli assume-role-policy to add claude-castiel-deploy-role
#    (see bootstrap.sh for the exact command)

# 3. Request ACM cert in us-east-1
aws acm request-certificate \
  --domain-name castiel-engle.com \
  --subject-alternative-names www.castiel-engle.com \
  --validation-method DNS \
  --region us-east-1

# 4. Add DNS validation CNAMEs in Route 53, wait for ISSUED status

# 5. Deploy site stack
AWS_PROFILE=claude-castiel aws cloudformation deploy \
  --template-file infra/static-site.yaml \
  --stack-name castiel-engle-com \
  --region ap-southeast-1 \
  --parameter-overrides \
      HostedZoneId=Z09985112EN35EV3NZ658 \
      CertificateArn=<ACM_ARN_FROM_STEP_3>

# 6. Sync files to S3
AWS_PROFILE=claude-castiel aws s3 sync . s3://castiel-engle-com \
  --exclude "infra/*" --exclude ".github/*" --exclude "*.sh" --delete
```

## Ongoing Deployment
```bash
# Deploy: just push to main — GitHub Actions handles it
git push origin main

# Manual sync + cache bust
AWS_PROFILE=claude-castiel aws s3 sync . s3://castiel-engle-com \
  --exclude "infra/*" --exclude ".github/*" --exclude "*.sh" --delete
AWS_PROFILE=claude-castiel aws cloudfront create-invalidation \
  --distribution-id <DIST_ID> --paths "/*"
```

## Adding Castiel's Content
### New composition (MP3)
1. Upload file: `AWS_PROFILE=claude-castiel aws s3 cp track.mp3 s3://castiel-engle-com/music/`
2. Edit `music/manifest.json`:
   ```json
   {"tracks": [{"title": "My Song", "description": "Piano piece", "file": "music/my-song.mp3"}]}
   ```
3. Commit and push — CI/CD deploys automatically.

### New Python script
1. Upload file: `AWS_PROFILE=claude-castiel aws s3 cp script.py s3://castiel-engle-com/code/`
2. Edit `code/manifest.json`:
   ```json
   {"scripts": [{"title": "RPG Game", "description": "Text-based adventure", "file": "code/rpg.py"}]}
   ```
3. Commit and push.

## CI/CD (GitHub Actions)
- **Repo**: `vernonengle/castiel-website`
- **Workflow**: `.github/workflows/deploy.yml`
- **Auth**: GitHub OIDC federation (no stored secrets)
- **Environment**: `production` (OIDC sub claim uses environment name)
- **On PR**: lint (check files exist, validate JSON)
- **On push to main**: S3 sync + CloudFront invalidation
