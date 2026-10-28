-- demo data: 40 materials (5 projects, 4 locations, every type, status and condition),
-- so the app has something to show and to search through.
-- run with: npm run db:seed
-- safe to run again: it only replaces its own rows (qr_code starts with MAT-SEED-), your own materials stay.
-- price is per unit, the dashboard multiplies it by the quantity.

DELETE FROM materials WHERE qr_code LIKE 'MAT-SEED-%';

INSERT INTO materials
  (id, name, material_type, quantity, unit, status, location, `condition`, notes, qr_code, images, price, project_name, created_date)
VALUES
  -- wood
  (UUID(), 'Eiken balken 20x20 cm', 'wood', 14, 'pieces', 'for_sale', 'Loods A', 'good', 'Uit de kapconstructie, spijkervrij gemaakt. Lengte 4 tot 5 m.', 'MAT-SEED-001', '[]', 85.00, 'Sloop boerderij Dalfsen', NOW() - INTERVAL 12 DAY),
  (UUID(), 'Grenen vloerdelen', 'wood', 46, 'sqm', 'available', 'Loods A', 'fair', 'Met groef en messing, enkele spijkergaten.', 'MAT-SEED-002', '[]', 18.50, 'Sloop rijtjeshuizen Apeldoorn-Noord', NOW() - INTERVAL 20 DAY),
  (UUID(), 'Steigerplanken', 'wood', 60, 'pieces', 'for_reuse', 'Buitenterrein', 'fair', 'Verweerd, geschikt voor tuinmeubels of bekisting.', 'MAT-SEED-003', '[]', 6.00, 'Transformatie fabriekshal Kampen', NOW() - INTERVAL 33 DAY),
  (UUID(), 'Binnendeuren opdek wit', 'wood', 9, 'pieces', 'for_sale', 'Loods B', 'good', '83 x 211 cm, inclusief scharnieren en klinken.', 'MAT-SEED-004', '[]', 25.00, 'Renovatie basisschool Deventer', NOW() - INTERVAL 8 DAY),
  (UUID(), 'Eiken parket visgraat', 'wood', 32, 'sqm', 'reserved', 'Loods A', 'excellent', 'Gereserveerd voor een interieurbouwer, ophalen volgende week.', 'MAT-SEED-005', '[]', 42.00, 'Sloop kantoorpand Zwolle-Zuid', NOW() - INTERVAL 5 DAY),
  (UUID(), 'Spaanplaat restpartij', 'wood', 3, 'pallets', 'for_disposal', 'Buitenterrein', 'poor', 'Vochtschade, niet meer herbruikbaar.', 'MAT-SEED-006', '[]', NULL, 'Renovatie basisschool Deventer', NOW() - INTERVAL 40 DAY),
  -- metal
  (UUID(), 'Stalen HEA 200-balken', 'metal', 8, 'pieces', 'for_sale', 'Buitenterrein', 'good', 'Lengte 6 m, licht roestig aan de uiteinden.', 'MAT-SEED-007', '[]', 210.00, 'Transformatie fabriekshal Kampen', NOW() - INTERVAL 15 DAY),
  (UUID(), 'Koperen waterleiding 15 mm', 'metal', 38, 'kg', 'sold', 'Loods B', 'fair', 'Verkocht aan de oud-ijzerhandel.', 'MAT-SEED-008', '[]', 7.20, 'Sloop rijtjeshuizen Apeldoorn-Noord', NOW() - INTERVAL 60 DAY),
  (UUID(), 'Zinken dakgoot', 'metal', 24, 'linear_m', 'recycled', 'Bouwplaats', 'poor', 'Lek en gedeukt, als zink afgevoerd naar de recycler.', 'MAT-SEED-009', '[]', NULL, 'Sloop rijtjeshuizen Apeldoorn-Noord', NOW() - INTERVAL 55 DAY),
  (UUID(), 'Aluminium kozijnen', 'metal', 12, 'pieces', 'available', 'Loods B', 'good', 'Zonder glas, diverse maten rond 120 x 150 cm.', 'MAT-SEED-010', '[]', 35.00, 'Sloop kantoorpand Zwolle-Zuid', NOW() - INTERVAL 10 DAY),
  (UUID(), 'Stalen trapleuning', 'metal', 2, 'pieces', 'for_reuse', 'Loods A', 'excellent', 'Gepoedercoat antraciet, recht, 3,2 m.', 'MAT-SEED-011', '[]', 60.00, 'Renovatie basisschool Deventer', NOW() - INTERVAL 3 DAY),
  -- concrete
  (UUID(), 'Stelconplaten 200x200', 'concrete', 18, 'pieces', 'for_sale', 'Buitenterrein', 'good', 'Rijplaten met stalen rand, geschikt voor tijdelijke ondergrond.', 'MAT-SEED-012', '[]', 95.00, 'Transformatie fabriekshal Kampen', NOW() - INTERVAL 22 DAY),
  (UUID(), 'Betonpuin', 'concrete', 12000, 'kg', 'recycled', 'Bouwplaats', 'poor', 'Gebroken tot granulaat voor funderingen.', 'MAT-SEED-013', '[]', NULL, 'Sloop kantoorpand Zwolle-Zuid', NOW() - INTERVAL 70 DAY),
  (UUID(), 'Betontegels 30x30', 'concrete', 25, 'sqm', 'available', 'Buitenterrein', 'fair', 'Terrastegels, een paar met afgebroken hoekjes.', 'MAT-SEED-014', '[]', 4.50, 'Sloop rijtjeshuizen Apeldoorn-Noord', NOW() - INTERVAL 18 DAY),
  (UUID(), 'Betonnen lateien', 'concrete', 6, 'pieces', 'for_disposal', 'Bouwplaats', 'poor', 'Wapening zichtbaar en geroest.', 'MAT-SEED-015', '[]', NULL, 'Sloop boerderij Dalfsen', NOW() - INTERVAL 28 DAY),
  -- brick
  (UUID(), 'Rode baksteen Waalformaat', 'brick', 2400, 'pieces', 'for_sale', 'Buitenterrein', 'good', 'Gebikt en op pallets gestapeld, oude kalkmortel verwijderd.', 'MAT-SEED-016', '[]', 0.45, 'Sloop boerderij Dalfsen', NOW() - INTERVAL 14 DAY),
  (UUID(), 'Gele klinkers', 'brick', 6, 'pallets', 'reserved', 'Buitenterrein', 'excellent', 'Gereserveerd door een hovenier.', 'MAT-SEED-017', '[]', 120.00, 'Sloop rijtjeshuizen Apeldoorn-Noord', NOW() - INTERVAL 9 DAY),
  (UUID(), 'Kalkzandsteenblokken', 'brick', 140, 'pieces', 'for_reuse', 'Loods B', 'fair', 'Binnenspouwblad, sommige met boorgaten.', 'MAT-SEED-018', '[]', 1.50, 'Sloop kantoorpand Zwolle-Zuid', NOW() - INTERVAL 25 DAY),
  (UUID(), 'Metselpuin gemengd', 'brick', 8000, 'kg', 'disposed', 'Bouwplaats', 'poor', 'Gemengd met tegels en mortel, afgevoerd.', 'MAT-SEED-019', '[]', NULL, 'Renovatie basisschool Deventer', NOW() - INTERVAL 80 DAY),
  -- glass
  (UUID(), 'Dubbel glas HR++', 'glass', 16, 'pieces', 'for_sale', 'Loods A', 'good', 'Ruiten 100 x 140 cm uit de kantoorgevel, zonder kozijn.', 'MAT-SEED-020', '[]', 30.00, 'Sloop kantoorpand Zwolle-Zuid', NOW() - INTERVAL 11 DAY),
  (UUID(), 'Glazen binnenwanden', 'glass', 5, 'pieces', 'available', 'Loods A', 'excellent', 'Gehard glas met aluminium profielen, zo goed als nieuw.', 'MAT-SEED-021', '[]', 150.00, 'Sloop kantoorpand Zwolle-Zuid', NOW() - INTERVAL 6 DAY),
  (UUID(), 'Enkel glas restpartij', 'glass', 2, 'boxes', 'recycled', 'Bouwplaats', 'poor', 'Gebarsten ruiten, naar de glasbak.', 'MAT-SEED-022', '[]', NULL, 'Sloop boerderij Dalfsen', NOW() - INTERVAL 45 DAY),
  -- fixtures
  (UUID(), 'Lichtarmaturen TL', 'fixtures', 48, 'pieces', 'for_sale', 'Loods B', 'fair', 'Systeemplafond-armaturen 60x60, lampen niet getest.', 'MAT-SEED-023', '[]', 8.00, 'Sloop kantoorpand Zwolle-Zuid', NOW() - INTERVAL 16 DAY),
  (UUID(), 'Keukenblok met spoelbak', 'fixtures', 1, 'pieces', 'sold', 'Loods B', 'good', 'Lengte 2,4 m, werkblad met lichte krasjes.', 'MAT-SEED-024', '[]', 275.00, 'Sloop rijtjeshuizen Apeldoorn-Noord', NOW() - INTERVAL 50 DAY),
  (UUID(), 'Kapstokken en garderoberekken', 'fixtures', 7, 'pieces', 'for_reuse', 'Loods A', 'good', 'Uit de gangen van de school, stevig staal.', 'MAT-SEED-025', '[]', 15.00, 'Renovatie basisschool Deventer', NOW() - INTERVAL 7 DAY),
  -- appliances
  (UUID(), 'Cv-ketel combi', 'appliances', 2, 'pieces', 'for_sale', 'Loods B', 'fair', 'Bouwjaar 2016, werkte tot de sloop, niet gekeurd.', 'MAT-SEED-026', '[]', 180.00, 'Sloop rijtjeshuizen Apeldoorn-Noord', NOW() - INTERVAL 19 DAY),
  (UUID(), 'Elektrische boiler 80 liter', 'appliances', 3, 'pieces', 'available', 'Loods B', 'good', 'Kalkvrij gemaakt.', 'MAT-SEED-027', '[]', 90.00, 'Renovatie basisschool Deventer', NOW() - INTERVAL 13 DAY),
  (UUID(), 'Koelkasten kantine', 'appliances', 4, 'pieces', 'for_disposal', 'Bouwplaats', 'poor', 'Koelmiddel moet door een erkend bedrijf worden afgetapt.', 'MAT-SEED-028', '[]', NULL, 'Sloop kantoorpand Zwolle-Zuid', NOW() - INTERVAL 30 DAY),
  -- roofing
  (UUID(), 'Dakpannen OVH rood', 'roofing', 1800, 'pieces', 'for_sale', 'Buitenterrein', 'good', 'Oud Hollandse pannen, gesorteerd op kleur.', 'MAT-SEED-029', '[]', 0.80, 'Sloop boerderij Dalfsen', NOW() - INTERVAL 21 DAY),
  (UUID(), 'Bitumen dakbedekking', 'roofing', 220, 'sqm', 'disposed', 'Bouwplaats', 'poor', 'Gescheiden afgevoerd als bitumineus afval.', 'MAT-SEED-030', '[]', NULL, 'Transformatie fabriekshal Kampen', NOW() - INTERVAL 65 DAY),
  (UUID(), 'Golfplaten polyester', 'roofing', 30, 'pieces', 'for_reuse', 'Buitenterrein', 'fair', 'Lichtdoorlatend, geschikt voor een schuur of kas.', 'MAT-SEED-031', '[]', 12.00, 'Transformatie fabriekshal Kampen', NOW() - INTERVAL 26 DAY),
  -- plumbing
  (UUID(), 'Radiatoren paneel type 22', 'plumbing', 11, 'pieces', 'for_sale', 'Loods B', 'good', 'Diverse lengtes 60 tot 140 cm, doorgespoeld.', 'MAT-SEED-032', '[]', 40.00, 'Renovatie basisschool Deventer', NOW() - INTERVAL 17 DAY),
  (UUID(), 'Toiletpotten hangend', 'plumbing', 6, 'pieces', 'available', 'Loods B', 'excellent', 'Wit, merk Sphinx, zonder bril.', 'MAT-SEED-033', '[]', 35.00, 'Sloop kantoorpand Zwolle-Zuid', NOW() - INTERVAL 4 DAY),
  (UUID(), 'Wastafels met kraan', 'plumbing', 10, 'pieces', 'reserved', 'Loods B', 'good', 'Gereserveerd voor een kringloopwinkel.', 'MAT-SEED-034', '[]', 20.00, 'Renovatie basisschool Deventer', NOW() - INTERVAL 12 DAY),
  (UUID(), 'PVC-afvoerbuis 110 mm', 'plumbing', 45, 'linear_m', 'recycled', 'Bouwplaats', 'fair', 'Ingeleverd bij de PVC-inzameling.', 'MAT-SEED-035', '[]', NULL, 'Sloop rijtjeshuizen Apeldoorn-Noord', NOW() - INTERVAL 48 DAY),
  -- electrical
  (UUID(), 'Groepenkast 8 groepen', 'electrical', 3, 'pieces', 'for_sale', 'Loods A', 'fair', 'Niet gekeurd, alleen voor een erkend installateur.', 'MAT-SEED-036', '[]', 45.00, 'Sloop rijtjeshuizen Apeldoorn-Noord', NOW() - INTERVAL 24 DAY),
  (UUID(), 'Kabelgoten verzinkt', 'electrical', 85, 'linear_m', 'available', 'Loods A', 'good', 'Breedte 200 mm, met bevestigingsbeugels.', 'MAT-SEED-037', '[]', 5.50, 'Transformatie fabriekshal Kampen', NOW() - INTERVAL 9 DAY),
  (UUID(), 'Koperkabel restpartij', 'electrical', 140, 'kg', 'sold', 'Loods A', 'poor', 'Gestript en verkocht per kilo.', 'MAT-SEED-038', '[]', 6.80, 'Transformatie fabriekshal Kampen', NOW() - INTERVAL 58 DAY),
  -- other
  (UUID(), 'Hardstenen dorpels', 'other', 9, 'pieces', 'for_sale', 'Loods A', 'excellent', 'Belgisch hardsteen, lengte 90 tot 110 cm.', 'MAT-SEED-039', '[]', 55.00, 'Sloop boerderij Dalfsen', NOW() - INTERVAL 2 DAY),
  (UUID(), 'Natuurstenen vensterbanken', 'other', 14, 'pieces', 'available', 'Loods A', 'good', 'Marmer, wit met grijze ader.', 'MAT-SEED-040', '[]', 28.00, 'Sloop kantoorpand Zwolle-Zuid', NOW() - INTERVAL 1 DAY);
