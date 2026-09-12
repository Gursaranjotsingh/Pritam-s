-- =====================================================================
-- OPTIONAL MIGRATION: backfill ingredients & descriptions
--
-- If you already ran supabase/schema.sql before this update, your four
-- starter products were seeded with placeholder ingredients — schema.sql's
-- seed step uses "on conflict do nothing", so simply re-running it will NOT
-- update rows that already exist. Run this script once in the Supabase SQL
-- Editor to backfill the real ingredient lists onto your existing products.
--
-- Safe to run multiple times. Only touches rows that still have the old
-- literal placeholder text — if you've already edited a product's
-- ingredients/description from Admin → Products, this will leave it alone.
-- =====================================================================

update products set
  ingredients = 'Raw mango, mustard oil, red chilli powder, fenugreek seeds (methi), mustard seeds (rai), fennel seeds (saunf), turmeric powder, asafoetida (hing), salt',
  description = 'Made at home the traditional way — raw mangoes hand-cut and mixed with mustard oil and whole spices, then left to mature for that deep, tangy household flavour.'
where slug = 'aam-achaar'
  and ingredients like 'Placeholder%';

update products set
  ingredients = 'Lemon, salt, red chilli powder, turmeric powder, mustard oil, fenugreek seeds (methi), mustard seeds (rai), asafoetida (hing), black salt (kala namak)',
  description = 'Whole lemons pickled the traditional way and sun-cured with salt and warm spices for a tangy, mouth-watering achaar that softens beautifully over time.'
where slug = 'nimbu-achaar'
  and ingredients like 'Placeholder%';

update products set
  ingredients = 'Green chilli, mustard oil, mustard seeds (rai), fennel seeds (saunf), fenugreek seeds (methi), turmeric powder, salt, lemon juice, asafoetida (hing)',
  description = 'Fresh green chillies slit and packed with a bold mustard-seed masala — a fiery, tangy achaar for those who like real heat with their meal.'
where slug = 'mirch-achaar'
  and ingredients like 'Placeholder%';

update products set
  ingredients = 'Raw mango, carrot, turnip, cauliflower, green chilli, mustard oil, mustard seeds (rai), fenugreek seeds (methi), fennel seeds (saunf), turmeric powder, red chilli powder, salt',
  description = 'A homely mix of raw mango and seasonal vegetables, pickled together in mustard oil and traditional spices for a well-rounded, everyday achaar.'
where slug = 'mix-achaar'
  and ingredients like 'Placeholder%';
