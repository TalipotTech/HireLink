ALTER TABLE payments MODIFY COLUMN payment_method VARCHAR(50) NULL;

-- Fix primary_category_id column type to match service_categories.category_id (BIGINT UNSIGNED)
-- Required because Hibernate creates BIGINT (signed) by default, but the schema uses BIGINT UNSIGNED
ALTER TABLE service_providers MODIFY COLUMN primary_category_id BIGINT UNSIGNED NULL;