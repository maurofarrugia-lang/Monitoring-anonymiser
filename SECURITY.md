# Security Policy

## Local-first usage
This project is designed to run locally on `localhost` or as a desktop-wrapped local service. Do not deploy it as a public internet-facing service without a full security review.

## Privacy posture
- No external AI or cloud OCR services should be used.
- Uploaded files must not be logged.
- Temporary working files must be deleted after export or session cleanup.
- Session substitution maps should remain in memory only.

## Recommended hardening
- Run behind local authentication if used on a shared workstation.
- Disable reverse-proxy request-body logging.
- Mount `/tmp` as tmpfs when using Docker.
- Regularly patch Python dependencies.
- Add malware scanning before importing untrusted files in high-risk environments.

## Reporting
Open a private security advisory in GitHub for vulnerabilities.
