# Privacy Notice

This application is intended for local-only anonymisation of case file materials.

## Design goals
- No remote storage of uploaded content
- No external API calls for document processing
- No analytics or telemetry by default
- Session data deleted after processing/export

## Important note
If you keep the application running, temporary processed files may exist in the local temp session folder until you click cleanup or restart the app. The supplied code includes a cleanup endpoint and startup cleanup routine.

## Operational recommendation
Use this tool only on a trusted machine and verify anonymised output before sharing.
