CREATE TABLE IF NOT EXISTS emotions (
 insight_id INTEGER NOT NULL REFERENCES insights(id), browser TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('checked','sad','happy')),
 PRIMARY KEY(insight_id,browser,kind)
);
