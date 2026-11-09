ALTER TABLE insights ADD COLUMN owner_hash TEXT CHECK(owner_hash IS NULL OR (length(owner_hash)=64 AND owner_hash NOT GLOB '*[^0-9a-f]*'));
