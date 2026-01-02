# Database Structure - CORRECTED Understanding

## Images Database (`database.sqlite`)

### Tables:
1. **`images`** table
   - `id` (PRIMARY KEY)
   - `filepath`, `width`, `length`, `ownership`, etc.

2. **`tags`** table (for regular image tags)
   - `id` (PRIMARY KEY)
   - `name` (UNIQUE) - stores regular image tags like "twill", "cat", "clara"
   - **Does NOT include pattern tags**

3. **`image_tags`** table (Junction table for regular tags)
   - `image_id` (FOREIGN KEY → images.id)
   - `tag_id` (FOREIGN KEY → tags.id)
   - PRIMARY KEY (image_id, tag_id)

4. **`pattern_tags`** table (for image pattern tags) - **SEPARATE TABLE**
   - `id` (PRIMARY KEY)
   - `name` (UNIQUE) - stores pattern tag names like "345", "twill" (WITHOUT "pattern:" prefix)

5. **`image_pattern_tags`** table (Junction table for pattern tags) - **SEPARATE TABLE**
   - `image_id` (FOREIGN KEY → images.id)
   - `pattern_tag_id` (FOREIGN KEY → pattern_tags.id)
   - PRIMARY KEY (image_id, pattern_tag_id)

### Example for Image 204:
```
images table:
id  | filepath
204 | "uploads/image204.jpg"

tags table (regular tags):
id | name
1  | "twill"
2  | "cat"

image_tags table (regular tags):
image_id | tag_id
204      | 1      → Image 204 has regular tag "twill"
204      | 2      → Image 204 has regular tag "cat"

pattern_tags table (pattern tags for images):
id | name
1  | "345"
2  | "twill"

image_pattern_tags table (pattern tags):
image_id | pattern_tag_id
204      | 1              → Image 204 has pattern tag "345"
204      | 2              → Image 204 has pattern tag "twill"
```

### Query to get image regular tags:
```sql
SELECT t.name 
FROM tags t
JOIN image_tags it ON t.id = it.tag_id
WHERE it.image_id = 204
-- Returns: ["twill", "cat"]
```

### Query to get image pattern tags:
```sql
SELECT pt.name 
FROM pattern_tags pt
JOIN image_pattern_tags ipt ON pt.id = ipt.pattern_tag_id
WHERE ipt.image_id = 204
-- Returns: ["345", "twill"]
```

---

## Patterns Database (`pattern_database.sqlite`)

### Tables:
1. **`patterns`** table
   - `id` (PRIMARY KEY)
   - `filepath`, `name`, `ownership`, etc.

2. **`pattern_tags`** table
   - `id` (PRIMARY KEY)
   - `name` (UNIQUE) - stores pattern tag names like "345", "twill" (WITHOUT "pattern:" prefix)

3. **`pattern_tag_links`** table (Junction table)
   - `pattern_id` (FOREIGN KEY → patterns.id)
   - `tag_id` (FOREIGN KEY → pattern_tags.id)
   - PRIMARY KEY (pattern_id, tag_id)

---

## Key Points:

1. **Images have 2 separate tag systems:**
   - Regular tags: `tags` table + `image_tags` junction
   - Pattern tags: `pattern_tags` table + `image_pattern_tags` junction

2. **Pattern tags for images are stored WITHOUT "pattern:" prefix** in `pattern_tags` table

3. **Patterns also use `pattern_tags` table** (in separate database) with same structure

4. **When counting patterns for chips**, we need to:
   - Extract "345" from search tag "pattern:345"
   - Match against `pattern_tags.name = "345"` in the patterns database





















