CREATE TABLE IF NOT EXISTS insights (
 id INTEGER PRIMARY KEY, submission TEXT NOT NULL UNIQUE,
 name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 80),
 body TEXT NOT NULL CHECK(length(trim(body)) BETWEEN 1 AND 6000),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS comments (
 id INTEGER PRIMARY KEY, submission TEXT NOT NULL UNIQUE,
 insight_id INTEGER NOT NULL REFERENCES insights(id),
 name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 80),
 body TEXT NOT NULL CHECK(length(trim(body)) BETWEEN 1 AND 3000),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS recognitions (
 insight_id INTEGER NOT NULL REFERENCES insights(id), browser TEXT NOT NULL,
 PRIMARY KEY(insight_id,browser)
);
CREATE INDEX IF NOT EXISTS comments_parent ON comments(insight_id,created_at);
