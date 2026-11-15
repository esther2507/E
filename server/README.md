## AI reading reports

Set `OPENAI_API_KEY` in `server/.env` to enable reports. `OPENAI_MODEL` is optional and defaults to `gpt-4o-mini`. Keep the key on the server; never add it to client code or commit it.

The report is available to the teacher after a session is completed. Exact answers remain in the database and are sent for analysis after the request excludes student/session identifiers and redacts known names, organization names, email addresses, and phone numbers. Accuracy and vowel-error metrics are calculated by the server; fluency is not scored until its rating thresholds are defined.

The HTTP server starts even if MongoDB is unavailable. Check `GET /api/health` for server/database status; database-backed API requests return HTTP 503 until MongoDB connects. Run `npm test` in `server/` to verify assessment calculations without a database connection.
