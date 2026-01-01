# Database Structure for Images and Patterns

## Images Database (`database.sqlite`)

### Tables:
1. **`images`** table
   - `id` (PRIMARY KEY)
   - `filepath`
   - `width`, `length`, `ownership`, etc.

2. **`tags`** table (for regular image tags)
   - `id` (PRIMARY KEY)
   - `name` (UNIQUE) - stores regular image tags like "twill", "cat", "clara"

3. **`image_tags`** table (Junction table for regular tags)
   - `image_id` (FOREIGN KEY → images.id)
   - `tag_id` (FOREIGN KEY → tags.id)
   - PRIMARY KEY (image_id, tag_id)

4. **`pattern_tags`** table (for image pattern tags) - **SEPARATE TABLE**
   - `id` (PRIMARY KEY)
   - `name` (UNIQUE) - stores pattern tags like "345", "twill" (WITHOUT "pattern:" prefix)

5. **`image_pattern_tags`** table (Junction table for pattern tags) - **SEPARATE TABLE**
   - `image_id` (FOREIGN KEY → images.id)
   - `pattern_tag_id` (FOREIGN KEY → pattern_tags.id)
   - PRIMARY KEY (image_id, pattern_tag_id)

### Example Data:
```
images table:
id  | filepath
204 | "uploads/image204.jpg"

tags table:
id | name
1  | "pattern:345"
2  | "twill"
3  | "cat"

image_tags table (Junction):
image_id | tag_id
204      | 1      → Image 204 has tag "pattern:345"
204      | 2      → Image 204 has tag "twill"
```

### Query to get image tags:
```sql
SELECT t.name 
FROM tags t
JOIN image_tags it ON t.id = it.tag_id
WHERE it.image_id = 204
-- Returns: ["pattern:345", "twill"]
```

---

## Patterns Database (`pattern_database.sqlite`)

### Tables:
1. **`patterns`** table
   - `id` (PRIMARY KEY)
   - `filepath`
   - `name`, `ownership`, etc.

2. **`pattern_tags`** table
   - `id` (PRIMARY KEY)
   - `name` (UNIQUE) - stores tag names like "345", "twill", "damask" (WITHOUT "pattern:" prefix)

3. **`pattern_tag_links`** table (Junction table)
   - `pattern_id` (FOREIGN KEY → patterns.id)
   - `tag_id` (FOREIGN KEY → pattern_tags.id)
   - PRIMARY KEY (pattern_id, tag_id)

### Example Data:
```
patterns table:
id | filepath              | name
1  | "patterns/pattern1.jpg" | "Pattern 1"

pattern_tags table:
id | name
1  | "345"
2  | "twill"
3  | "damask"

pattern_tag_links table (Junction):
pattern_id | tag_id
1          | 1      → Pattern 1 has tag "345"
1          | 2      → Pattern 1 has tag "twill"
```

### Query to get pattern tags:
```sql
SELECT pt.name 
FROM pattern_tags pt
JOIN pattern_tag_links ptl ON pt.id = ptl.tag_id
WHERE ptl.pattern_id = 1
-- Returns: ["345", "twill"]
```

---

## Key Differences:

1. **Separate Databases:**
   - Images: `database.sqlite`
   - Patterns: `pattern_database.sqlite`

2. **Tag Storage:**
   - **Images**: Tags stored WITH "pattern:" prefix → `"pattern:345"`
   - **Patterns**: Tags stored WITHOUT "pattern:" prefix → `"345"`

3. **Junction Tables:**
   - Images: `image_tags` (image_id, tag_id)
   - Patterns: `pattern_tag_links` (pattern_id, tag_id)

4. **Connection:**
   - Both use junction tables to connect entities to tags via IDs
   - Many-to-many relationship: one image/pattern can have many tags, one tag can belong to many images/patterns

