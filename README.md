# jackjennagranttomas

Environment and setup
---------------------

This project uses environment variables for API keys and database configuration. Copy `.env.example` to `.env` and fill in real values before running scripts that need DB or API access. The repository `.gitignore` already ignores `.env`.

Quick steps
1. Create a virtual environment and activate it (optional but recommended).
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Copy the example env and edit values:

```bash
cp .env.example .env
# edit .env with your DB credentials and Spotify keys
```
