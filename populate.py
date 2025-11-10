import os
import random
import requests
import psycopg2
from typing import List
from dotenv import load_dotenv
from faker import Faker

# Load environment variables from .env file
load_dotenv()

# Database configuration
DATABASE_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'music_db'),
    'user': os.getenv('DB_USER', 'db_user'),
    'password': os.getenv('DB_PASSWORD', 'db_password')
}

# Spotify API credentials
SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID", "YOUR_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET", "YOUR_CLIENT_SECRET")
SPOTIFY_TOKEN_URL = os.getenv("SPOTIFY_TOKEN_URL", "https://accounts.spotify.com/api/token")

# Data volume settings
NUM_TRACKS_TO_FETCH = int(os.getenv("NUM_TRACKS_TO_FETCH", "50"))
MIN_FAKE_ARTISTS = int(os.getenv("MIN_FAKE_ARTISTS", "10"))

# Initialize Faker with seed for reproducible fake data
Faker.seed(0)
fake = Faker()

# Helpful runtime check: warn if keys are likely unset
if SPOTIFY_CLIENT_ID.startswith("YOUR_") or SPOTIFY_CLIENT_SECRET.startswith("YOUR_"):
    print("⚠️  Warning: Spotify client ID/secret look like placeholders.")
    print("    Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in your .env file.")

def get_spotify_token() -> str:
    """Authenticates with Spotify API and returns the Bearer token."""
    try:
        print("🔑 Authenticating with Spotify API...")
        response = requests.post(
            SPOTIFY_TOKEN_URL,
            data={
                'grant_type': 'client_credentials',
                'client_id': SPOTIFY_CLIENT_ID,
                'client_secret': SPOTIFY_CLIENT_SECRET
            }
        )
        response.raise_for_status()
        token = response.json()['access_token']
        print("✅ Successfully authenticated with Spotify!")
        return token
    except requests.exceptions.RequestException as e:
        print(f"❌ Error authenticating with Spotify: {e}")
        return ""

def connect_db(config):
    """Establishes and returns a database connection."""
    try:
        print(f"🔌 Connecting to database at {config['host']}:{config['port']}...")
        conn = psycopg2.connect(**config)
        print("✅ Successfully connected to database!")
        return conn
    except Exception as e:
        print(f"❌ Error connecting to the database: {e}")
        return None
    
def fetch_spotify_data(token: str) -> List[dict]:
    """Fetches popular tracks from Spotify using search."""
    headers = {"Authorization": f"Bearer {token}"}
    
    # Use search API to get popular tracks
    # Search for tracks with high popularity across different genres
    search_terms = ["pop", "rock", "hip hop", "electronic", "jazz"]
    tracks = []
    
    try:
        print(f"🎵 Fetching {NUM_TRACKS_TO_FETCH} popular tracks from Spotify...")
        
        tracks_per_genre = NUM_TRACKS_TO_FETCH // len(search_terms) + 1
        
        for term in search_terms:
            if len(tracks) >= NUM_TRACKS_TO_FETCH:
                break
                
            url = f"https://api.spotify.com/v1/search?q={term}&type=track&limit={tracks_per_genre}"
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            items = response.json().get('tracks', {}).get('items', [])
            for track_data in items:
                if track_data and track_data.get('album') and track_data.get('artists'):
                    tracks.append(track_data)
                if len(tracks) >= NUM_TRACKS_TO_FETCH:
                    break
        
        print(f"✅ Successfully fetched {len(tracks)} valid tracks!")
        return tracks
    except requests.exceptions.RequestException as e:
        print(f"❌ Error fetching Spotify data: {e}")
        return []

def populate_database(conn, spotify_tracks: List[dict]):
    """Populates the database with Spotify tracks and synthetic data."""
    cursor = conn.cursor()
    
    # Dictionaries to store name-to-ID mapping
    album_map = {}  # album_name: album_id
    artist_map = {}  # artist_name: artist_id
    
    # Storage for insertion data
    album_data = []
    artist_data = []
    track_inserts = []
    audio_feature_inserts = []
    track_artist_inserts = []
    
    print("\n" + "="*50)
    print("Starting database population...")
    print("="*50)
    
    # 1. Insert Artists (Real and Synthetic)
    print("\n📊 Step 1: Populating Artist table...")
    
    # Add real artists from Spotify
    seen_artists = set()
    for track in spotify_tracks:
        for artist in track['artists']:
            artist_name = artist['name']
            if artist_name not in seen_artists:
                artist_data.append((artist_name,))
                seen_artists.add(artist_name)
    
    print(f"   → Found {len(artist_data)} unique artists from Spotify")
    
    # Add synthetic artists to increase variety
    for _ in range(MIN_FAKE_ARTISTS):
        artist_name = fake.unique.name() + " (Synthetic)"
        artist_data.append((artist_name,))
    
    print(f"   → Added {MIN_FAKE_ARTISTS} synthetic artists")
    
    # Insert all artists and build the artist_map
    insert_artist_query = "INSERT INTO Artist (name) VALUES (%s) RETURNING artist_id, name;"
    for artist_tuple in artist_data:
        cursor.execute(insert_artist_query, artist_tuple)
        artist_id, name = cursor.fetchone()
        artist_map[name] = artist_id
    
    conn.commit()
    print(f"   ✅ Inserted {len(artist_map)} total artists")

    # 2. Insert Albums
    print("\n📊 Step 2: Populating Album table...")
    
    seen_albums = set()
    for track in spotify_tracks:
        album = track['album']
        album_name = album['name']
        if album_name not in seen_albums:
            release_date = album.get('release_date', '2024-01-01')
            album_data.append((album_name, release_date))
            seen_albums.add(album_name)
    
    print(f"   → Found {len(album_data)} unique albums from Spotify")
    
    # Insert all albums and build the album_map
    insert_album_query = "INSERT INTO Album (name, release_date) VALUES (%s, %s) RETURNING album_id, name;"
    for album_tuple in album_data:
        cursor.execute(insert_album_query, album_tuple)
        album_id, name = cursor.fetchone()
        album_map[name] = album_id
    
    conn.commit()
    print(f"   ✅ Inserted {len(album_map)} albums")
    
    # 3. Insert Tracks (Real and Synthetic)
    print("\n📊 Step 3: Populating Track table...")
    
    # Insert real Spotify tracks
    for track in spotify_tracks:
        track_name = track['name']
        duration_ms = track.get('duration_ms', 180000)
        duration_sec = duration_ms // 1000  # Convert to seconds
        album_id = album_map.get(track['album']['name'])
        
        if album_id:
            track_inserts.append((track_name, duration_sec, album_id))
    
    print(f"   → Prepared {len(track_inserts)} real tracks from Spotify")
    
    # Add some synthetic tracks
    num_synthetic = random.randint(10, 20)
    synthetic_album_ids = list(album_map.values())
    
    for _ in range(num_synthetic):
        track_name = fake.catch_phrase() + " (Synthetic)"
        duration_sec = random.randint(120, 300)  # 2-5 minutes in seconds
        album_id = random.choice(synthetic_album_ids)
        track_inserts.append((track_name, duration_sec, album_id))
    
    print(f"   → Added {num_synthetic} synthetic tracks")
    
    # Insert all tracks and collect their IDs
    insert_track_query = "INSERT INTO Track (name, duration, album_id) VALUES (%s, %s, %s) RETURNING track_id;"
    track_ids = []
    for track_tuple in track_inserts:
        cursor.execute(insert_track_query, track_tuple)
        track_id = cursor.fetchone()[0]
        track_ids.append(track_id)
    
    conn.commit()
    print(f"   ✅ Inserted {len(track_ids)} total tracks")
    
    # 4. Insert AudioFeatures
    print("\n📊 Step 4: Populating AudioFeatures table...")
    
    for track_id in track_ids:
        danceability = round(random.uniform(0.3, 0.95), 4)
        energy = round(random.uniform(0.2, 0.95), 4)
        valence = round(random.uniform(0.1, 0.9), 4)
        loudness = round(random.uniform(-30.0, 0.0), 4)
        
        audio_feature_inserts.append((track_id, danceability, energy, valence, loudness))
    
    insert_features_query = "INSERT INTO AudioFeatures (track_id, danceability, energy, valence, loudness) VALUES (%s, %s, %s, %s, %s);"
    cursor.executemany(insert_features_query, audio_feature_inserts)
    conn.commit()
    print(f"   ✅ Inserted {len(audio_feature_inserts)} audio features")
    
    # 5. Insert TrackArtists (Many-to-Many Relation)
    print("\n📊 Step 5: Populating TrackArtists join table...")
    
    # Map real Spotify tracks to their artists
    for i, track in enumerate(spotify_tracks):
        if i >= len(track_ids):
            break
        current_track_id = track_ids[i]
        
        for artist in track['artists']:
            artist_id = artist_map.get(artist['name'])
            if artist_id:
                track_artist_inserts.append((current_track_id, artist_id))
    
    print(f"   → Mapped {len(track_artist_inserts)} real track-artist relationships")
    
    # For synthetic tracks, assign random artists
    synthetic_track_ids = track_ids[len(spotify_tracks):]
    all_artist_ids = list(artist_map.values())
    
    synthetic_relationships = 0
    for track_id in synthetic_track_ids:
        num_artists = random.randint(1, 3)
        assigned_artists = random.sample(all_artist_ids, min(num_artists, len(all_artist_ids)))
        for artist_id in assigned_artists:
            track_artist_inserts.append((track_id, artist_id))
            synthetic_relationships += 1
    
    print(f"   → Created {synthetic_relationships} synthetic track-artist relationships")
    
    insert_ta_query = "INSERT INTO TrackArtists (track_id, artist_id) VALUES (%s, %s);"
    cursor.executemany(insert_ta_query, track_artist_inserts)
    conn.commit()
    print(f"   ✅ Inserted {len(track_artist_inserts)} total track-artist relationships")
    
    print("\n" + "="*50)
    print("✅ Database population complete!")
    print("="*50)
    print(f"\nSummary:")
    print(f"  • Artists: {len(artist_map)}")
    print(f"  • Albums: {len(album_map)}")
    print(f"  • Tracks: {len(track_ids)}")
    print(f"  • Audio Features: {len(audio_feature_inserts)}")
    print(f"  • Track-Artist Relationships: {len(track_artist_inserts)}")
    print()
    
    cursor.close()

if __name__ == "__main__":
    print("\n🎵 Spotify Database Population Script 🎵\n")
    
    # 1. Get Spotify Token
    token = get_spotify_token()
    if not token:
        print("\n❌ Cannot proceed without a Spotify token.")
        print("   Please check your SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env")
        exit(1)
    
    # 2. Fetch Spotify Data
    spotify_tracks = fetch_spotify_data(token)
    if not spotify_tracks:
        print("\n❌ Cannot proceed without fetching track data.")
        print("   Check your internet connection and Spotify API credentials.")
        exit(1)
    
    # 3. Connect to DB
    conn = connect_db(DATABASE_CONFIG)
    if not conn:
        print("\n❌ Cannot proceed without a database connection.")
        print("   Please check your database configuration in .env")
        exit(1)
    
    try:
        # 4. Populate
        populate_database(conn, spotify_tracks)
    except Exception as e:
        print(f"\n❌ Error during database population: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()
        print("\n🔌 Database connection closed.")