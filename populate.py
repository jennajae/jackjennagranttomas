import os
import random
from typing import List

import psycopg2
import requests
from dotenv import load_dotenv
from faker import Faker

load_dotenv()

Faker.seed(0)
fake = Faker()

DATABASE_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
    "database": os.getenv("DB_NAME", "music_db"),
    "user": os.getenv("DB_USER", "db_user"),
    "password": os.getenv("DB_PASSWORD", "db_password"),
}
SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID", "YOUR_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET", "YOUR_CLIENT_SECRET")
SPOTIFY_TOKEN_URL = os.getenv(
    "SPOTIFY_TOKEN_URL", "https://accounts.spotify.com/api/token"
)
NUM_TRACKS_TO_FETCH = int(os.getenv("NUM_TRACKS_TO_FETCH", "50"))
MIN_FAKE_ARTISTS = int(os.getenv("MIN_FAKE_ARTISTS", "10"))


def get_spotify_token():
    try:
        print("Authing with Spotify API")
        response = requests.post(
            SPOTIFY_TOKEN_URL,
            data={
                "grant_type": "client_credentials",
                "client_id": SPOTIFY_CLIENT_ID,
                "client_secret": SPOTIFY_CLIENT_SECRET,
            },
        )
        response.raise_for_status()
        token = response.json()["access_token"]
        print("Successfully authenticated with Spotify")
        return token
    except requests.exceptions.RequestException as e:
        print(f"Error authenticating with Spotify: {e}")
        return ""


def connect_db(config):
    try:
        print(f"Connecting to database at {config['host']}:{config['port']}")
        conn = psycopg2.connect(**config)
        print("Successfully connected to database")
        return conn
    except Exception as e:
        print(f"Error connecting to the database: {e}")
        return None


def fetch_spotify_data(token: str) -> List[dict]:
    headers = {"Authorization": f"Bearer {token}"}
    search_terms = ["pop", "rock", "hip hop", "electronic", "jazz"]
    tracks = []
    try:
        print(f"Fetching {NUM_TRACKS_TO_FETCH} tracks from Spotify")

        tracks_per_genre = NUM_TRACKS_TO_FETCH // len(search_terms) + 1

        for term in search_terms:
            if len(tracks) >= NUM_TRACKS_TO_FETCH:
                break

            url = f"https://api.spotify.com/v1/search?q={term}&type=track&limit={tracks_per_genre}"
            response = requests.get(url, headers=headers)
            response.raise_for_status()

            items = response.json().get("tracks", {}).get("items", [])
            for track_data in items:
                if track_data and track_data.get("album") and track_data.get("artists"):
                    tracks.append(track_data)
                if len(tracks) >= NUM_TRACKS_TO_FETCH:
                    break

        print(f"Successfully grabbed {len(tracks)} tracks")
        return tracks
    except requests.exceptions.RequestException as e:
        print(f"Error fetching Spotify data: {e}")
        return []


def populate_database(conn, spotify_tracks: List[dict]):
    cursor = conn.cursor()
    album_map = {}
    artist_map = {}
    album_data = []
    artist_data = []
    track_inserts = []
    audio_feature_inserts = []
    track_artist_inserts = []
    print("populating database")
    print("populating artist table")
    seen_artists = set()
    for track in spotify_tracks:
        for artist in track["artists"]:
            artist_name = artist["name"]
            if artist_name not in seen_artists:
                artist_data.append((artist_name,))
                seen_artists.add(artist_name)

    insert_artist_query = (
        "INSERT INTO Artist (name) VALUES (%s) RETURNING artist_id, name;"
    )
    for artist_tuple in artist_data:
        cursor.execute(insert_artist_query, artist_tuple)
        artist_id, name = cursor.fetchone()
        artist_map[name] = artist_id

    conn.commit()
    print(f"added {len(artist_map)} total artists")

    print("populating Album table...")

    seen_albums = set()
    for track in spotify_tracks:
        album = track["album"]
        album_name = album["name"]
        if album_name not in seen_albums:
            release_date = album.get("release_date", "2024-01-01")
            album_data.append((album_name, release_date))
            seen_albums.add(album_name)

    insert_album_query = "INSERT INTO Album (name, release_date) VALUES (%s, %s) RETURNING album_id, name;"
    for album_tuple in album_data:
        cursor.execute(insert_album_query, album_tuple)
        album_id, name = cursor.fetchone()
        album_map[name] = album_id

    conn.commit()
    print(f"added {len(album_map)} albums")

    print("populating track table...")

    for track in spotify_tracks:
        track_name = track["name"]
        duration_ms = track.get("duration_ms", 180000)
        duration_sec = duration_ms // 1000  # Convert to seconds
        album_id = album_map.get(track["album"]["name"])

        if album_id:
            track_inserts.append((track_name, duration_sec, album_id))

    insert_track_query = "INSERT INTO Track (name, duration, album_id) VALUES (%s, %s, %s) RETURNING track_id;"
    track_ids = []
    for track_tuple in track_inserts:
        cursor.execute(insert_track_query, track_tuple)
        track_id = cursor.fetchone()[0]
        track_ids.append(track_id)

    conn.commit()
    print(f"added {len(track_ids)} total tracks")

    print("populating AudioFeatures table...")

    for track_id in track_ids:
        danceability = round(random.uniform(0.3, 0.95), 4)
        energy = round(random.uniform(0.2, 0.95), 4)
        valence = round(random.uniform(0.1, 0.9), 4)
        loudness = round(random.uniform(-30.0, 0.0), 4)

        audio_feature_inserts.append(
            (track_id, danceability, energy, valence, loudness)
        )

    insert_features_query = "INSERT INTO AudioFeatures (track_id, danceability, energy, valence, loudness) VALUES (%s, %s, %s, %s, %s);"
    cursor.executemany(insert_features_query, audio_feature_inserts)
    conn.commit()
    print(f"added {len(audio_feature_inserts)} audio features")

    print("populating TrackArtists table")

    for i, track in enumerate(spotify_tracks):
        if i >= len(track_ids):
            break
        current_track_id = track_ids[i]

        for artist in track["artists"]:
            artist_id = artist_map.get(artist["name"])
            if artist_id:
                track_artist_inserts.append((current_track_id, artist_id))

    insert_ta_query = "INSERT INTO TrackArtists (track_id, artist_id) VALUES (%s, %s);"
    cursor.executemany(insert_ta_query, track_artist_inserts)
    conn.commit()
    print(f"did {len(track_artist_inserts)} trackartists")

    cursor.close()


if __name__ == "__main__":
    token = get_spotify_token()
    if not token:
        print("Cannot proceed without a Spotify token")
        print("Please check your SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env")
        exit(1)

    spotify_tracks = fetch_spotify_data(token)
    if not spotify_tracks:
        print("Cannot proceed without fetching track data")
        print("Check your internet connection and Spotify API credentials.")
        exit(1)

    conn = connect_db(DATABASE_CONFIG)
    if not conn:
        print("Cannot proceed without a database connection")
        print("Please check your database configuration in .env")
        exit(1)

    try:
        populate_database(conn, spotify_tracks)
    except Exception as e:
        print(f"Error during database population: {e}")
        import traceback

        traceback.print_exc()
    finally:
        conn.close()
        print("closed databaset")

