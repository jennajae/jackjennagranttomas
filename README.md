# Spotify Analytics App - Jack, Jenna, Tomas, Grant

A Next.js + PostgreSQL web application that allows users to import Spotify tracks, store them in a database, and view detailed audio-feature analytics.

## <u>**Tech Stack**</u>

* Next.js

* npm

* PostgreSQL

* Git

Spotify Web API (Developer credentials required)

## <u>**Setup Instructions**</u>

### <u>Prerequisites</u>

Before you begin, make sure you have the following installed:

* Node.js 

* npm

* PostgreSQL

* Git

* A Spotify Developer Account for your Spotify Developer credentials (https://developer.spotify.com/dashboard)

### <u>1. Clone the Repository</u>

Open your terminal or VS Code, then run:

git clone https://github.com/jennajae/jackjennagranttomas.git


Move into the project directory:

cd jackjennagranttomas

### <u>2. Database Setup</u>

#### Step 1 — Create PostgreSQL Database

Open a terminal and log in to PostgreSQL:

`psql -U postgres`


Inside the psql shell, create a database and user:

`CREATE DATABASE database_name;
CREATE USER user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE database_name TO user;`

#### Step 2 — Initialize the Database Schema

Run the schema creation SQL from this link:

https://github.com/jennajae/jackjennagranttomas/blob/main/ddl_create_all_tables

### <u>3. Add Required Environment Variables</u>

Copy .env.example → .env and fill in:

`SPOTIFY_CLIENT_ID`

`SPOTIFY_CLIENT_SECRET`

`DATABASE_URL (example: postgres://user:password@localhost:5432/dbname)`

### <u>4. Install Dependencies</u>

Inside the project, navigate to the jackjennagranttomas directory:

`cd site`</br>
`npm install`

### <u>5. Run the App Locally</u>

`npm run dev`


Once it starts, visit:

http://localhost:3000 to run the web app locally

## <u>**App Workflow**</u>

Once the web app is running:

* Paste a Spotify track URL into the “Add Song” input field.

* Click "Add Song" — the track will be imported through the Spotify API.

The song will appear in your database list.

* Click any song to view its audio features.

Visit the Analytics page to view insights.

## <u>**Expected Output**</u>

After setup, the app should allow you to:

* Import Spotify tracks

* Store song metadata + audio features in PostgreSQL

* View song details

* Explore audio analytics visualizations