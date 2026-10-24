-- structure of the materials table, without data
CREATE TABLE materials (
  id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  material_type ENUM('wood','metal','concrete','brick','glass','fixtures','appliances','roofing','plumbing','electrical','other') NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit ENUM('pieces','kg','lbs','sqft','sqm','linear_ft','linear_m','pallets','boxes') DEFAULT 'pieces',
  status ENUM('available','reserved','for_sale','for_reuse','for_disposal','sold','disposed') NOT NULL DEFAULT 'available',
  location VARCHAR(255),
  `condition` ENUM('excellent','good','fair','poor'),
  notes TEXT,
  qr_code VARCHAR(255),
  images JSON,
  price DECIMAL(10,2),
  project_name VARCHAR(255),
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);
