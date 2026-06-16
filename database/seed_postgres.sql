-- ============================================================================
-- HIRELINK — PostgreSQL DEMO SEED DATA
-- ============================================================================
-- Hibernate (ddl-auto=update) owns the schema; this file inserts DATA ONLY.
-- Column names verified against the live PostgreSQL schema generated from the
-- com.hirelink @Entity classes.
--
-- Demo password for ALL accounts: password123
--   BCrypt hash ($2a$12$...) below matches BCryptPasswordEncoder(12) in SecurityConfig.
--
-- Idempotent: every row carries an explicit PK and uses ON CONFLICT DO NOTHING,
-- so re-running is safe. Sequences are realigned at the end so app-generated
-- inserts continue past the seeded ids.
--
-- Load with:
--   docker compose exec -T postgres psql -U hirelink -d hirelink_db < database/seed_postgres.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- USERS (Customers, Providers, Admins)
-- ============================================================================
INSERT INTO users (user_id, name, email, phone, password_hash, user_type, account_status, is_email_verified, is_phone_verified, preferred_language, profile_image_url, gender, created_at) VALUES
(1, 'Priya Sharma', 'priya.sharma@email.com', '9876543210', '$2a$12$b/tFjZChShbXoKZCK2YqYuKr8a501ns3RXwpTUE7bB3yySv.e2ePK', 'CUSTOMER', 'ACTIVE', TRUE, TRUE, 'EN', 'https://storage.hirelink.in/profiles/user_1.jpg', 'FEMALE', '2025-06-15 10:30:00'),
(2, 'Rahul Verma', 'rahul.verma@email.com', '9876543211', '$2a$12$b/tFjZChShbXoKZCK2YqYuKr8a501ns3RXwpTUE7bB3yySv.e2ePK', 'CUSTOMER', 'ACTIVE', TRUE, TRUE, 'HI', 'https://storage.hirelink.in/profiles/user_2.jpg', 'MALE', '2025-06-20 14:45:00'),
(3, 'Ananya Iyer', 'ananya.iyer@email.com', '9876543212', '$2a$12$b/tFjZChShbXoKZCK2YqYuKr8a501ns3RXwpTUE7bB3yySv.e2ePK', 'CUSTOMER', 'ACTIVE', TRUE, TRUE, 'TA', 'https://storage.hirelink.in/profiles/user_3.jpg', 'FEMALE', '2025-07-01 09:15:00'),
(4, 'Vikram Singh', 'vikram.singh@email.com', '9876543213', '$2a$12$b/tFjZChShbXoKZCK2YqYuKr8a501ns3RXwpTUE7bB3yySv.e2ePK', 'CUSTOMER', 'ACTIVE', TRUE, TRUE, 'EN', 'https://storage.hirelink.in/profiles/user_4.jpg', 'MALE', '2025-07-10 11:00:00'),
(5, 'Meera Patel', 'meera.patel@email.com', '9876543214', '$2a$12$b/tFjZChShbXoKZCK2YqYuKr8a501ns3RXwpTUE7bB3yySv.e2ePK', 'CUSTOMER', 'ACTIVE', TRUE, TRUE, 'GU', 'https://storage.hirelink.in/profiles/user_5.jpg', 'FEMALE', '2025-07-15 16:30:00'),
(6, 'Amit Kumar', 'amit.kumar@email.com', '9876543215', '$2a$12$b/tFjZChShbXoKZCK2YqYuKr8a501ns3RXwpTUE7bB3yySv.e2ePK', 'CUSTOMER', 'ACTIVE', FALSE, TRUE, 'HI', NULL, 'MALE', '2025-07-20 08:45:00'),
(7, 'Sneha Reddy', 'sneha.reddy@email.com', '9876543216', '$2a$12$b/tFjZChShbXoKZCK2YqYuKr8a501ns3RXwpTUE7bB3yySv.e2ePK', 'CUSTOMER', 'ACTIVE', TRUE, TRUE, 'TE', 'https://storage.hirelink.in/profiles/user_7.jpg', 'FEMALE', '2025-07-25 13:20:00'),
(8, 'Arjun Nair', 'arjun.nair@email.com', '9876543217', '$2a$12$b/tFjZChShbXoKZCK2YqYuKr8a501ns3RXwpTUE7bB3yySv.e2ePK', 'CUSTOMER', 'ACTIVE', TRUE, TRUE, 'ML', 'https://storage.hirelink.in/profiles/user_8.jpg', 'MALE', '2025-08-01 10:00:00'),
(9, 'Pooja Gupta', 'pooja.gupta@email.com', '9876543218', '$2a$12$b/tFjZChShbXoKZCK2YqYuKr8a501ns3RXwpTUE7bB3yySv.e2ePK', 'CUSTOMER', 'PENDING_VERIFICATION', FALSE, FALSE, 'HI', NULL, 'FEMALE', '2025-08-05 15:45:00'),
(10, 'Rohan Desai', 'rohan.desai@email.com', '9876543219', '$2a$12$b/tFjZChShbXoKZCK2YqYuKr8a501ns3RXwpTUE7bB3yySv.e2ePK', 'CUSTOMER', 'ACTIVE', TRUE, TRUE, 'MR', 'https://storage.hirelink.in/profiles/user_10.jpg', 'MALE', '2025-08-10 12:30:00'),
-- Service Providers (users who are also providers)
(11, 'Ramesh Kumar', 'ramesh.electrician@email.com', '9876543220', '$2a$12$b/tFjZChShbXoKZCK2YqYuKr8a501ns3RXwpTUE7bB3yySv.e2ePK', 'PROVIDER', 'ACTIVE', TRUE, TRUE, 'HI', 'https://storage.hirelink.in/profiles/provider_1.jpg', 'MALE', '2025-05-01 09:00:00'),
(12, 'Suresh Yadav', 'suresh.plumber@email.com', '9876543221', '$2a$12$b/tFjZChShbXoKZCK2YqYuKr8a501ns3RXwpTUE7bB3yySv.e2ePK', 'PROVIDER', 'ACTIVE', TRUE, TRUE, 'HI', 'https://storage.hirelink.in/profiles/provider_2.jpg', 'MALE', '2025-05-05 10:30:00'),
(13, 'Mahesh Sharma', 'mahesh.carpenter@email.com', '9876543222', '$2a$12$b/tFjZChShbXoKZCK2YqYuKr8a501ns3RXwpTUE7bB3yySv.e2ePK', 'PROVIDER', 'ACTIVE', TRUE, TRUE, 'EN', 'https://storage.hirelink.in/profiles/provider_3.jpg', 'MALE', '2025-05-10 11:45:00'),
(14, 'Lakshmi Devi', 'lakshmi.cleaner@email.com', '9876543223', '$2a$12$b/tFjZChShbXoKZCK2YqYuKr8a501ns3RXwpTUE7bB3yySv.e2ePK', 'PROVIDER', 'ACTIVE', TRUE, TRUE, 'TA', 'https://storage.hirelink.in/profiles/provider_4.jpg', 'FEMALE', '2025-05-15 08:15:00'),
(15, 'Ravi Prasad', 'ravi.painter@email.com', '9876543224', '$2a$12$b/tFjZChShbXoKZCK2YqYuKr8a501ns3RXwpTUE7bB3yySv.e2ePK', 'PROVIDER', 'ACTIVE', TRUE, TRUE, 'TE', 'https://storage.hirelink.in/profiles/provider_5.jpg', 'MALE', '2025-05-20 14:00:00'),
(16, 'Gopal Menon', 'gopal.ac@email.com', '9876543225', '$2a$12$b/tFjZChShbXoKZCK2YqYuKr8a501ns3RXwpTUE7bB3yySv.e2ePK', 'PROVIDER', 'ACTIVE', TRUE, TRUE, 'ML', 'https://storage.hirelink.in/profiles/provider_6.jpg', 'MALE', '2025-05-25 09:30:00'),
(17, 'Vijay Mason', 'vijay.mason@email.com', '9876543226', '$2a$12$b/tFjZChShbXoKZCK2YqYuKr8a501ns3RXwpTUE7bB3yySv.e2ePK', 'PROVIDER', 'ACTIVE', TRUE, TRUE, 'HI', 'https://storage.hirelink.in/profiles/provider_7.jpg', 'MALE', '2025-06-01 10:00:00'),
(18, 'Santosh Electric', 'santosh.electric@email.com', '9876543227', '$2a$12$b/tFjZChShbXoKZCK2YqYuKr8a501ns3RXwpTUE7bB3yySv.e2ePK', 'PROVIDER', 'ACTIVE', TRUE, TRUE, 'MR', 'https://storage.hirelink.in/profiles/provider_8.jpg', 'MALE', '2025-06-05 11:15:00'),
(19, 'Kiran Appliance', 'kiran.appliance@email.com', '9876543228', '$2a$12$b/tFjZChShbXoKZCK2YqYuKr8a501ns3RXwpTUE7bB3yySv.e2ePK', 'PROVIDER', 'PENDING_VERIFICATION', FALSE, TRUE, 'KN', NULL, 'MALE', '2025-06-10 15:30:00'),
(20, 'Prakash Welder', 'prakash.welder@email.com', '9876543229', '$2a$12$b/tFjZChShbXoKZCK2YqYuKr8a501ns3RXwpTUE7bB3yySv.e2ePK', 'PROVIDER', 'ACTIVE', TRUE, TRUE, 'BN', 'https://storage.hirelink.in/profiles/provider_10.jpg', 'MALE', '2025-06-15 12:00:00'),
-- Admins
(21, 'Admin User', 'admin@hirelink.in', '9876543230', '$2a$12$b/tFjZChShbXoKZCK2YqYuKr8a501ns3RXwpTUE7bB3yySv.e2ePK', 'ADMIN', 'ACTIVE', TRUE, TRUE, 'EN', 'https://storage.hirelink.in/profiles/admin_1.jpg', 'MALE', '2025-01-01 00:00:00'),
(22, 'Super Admin', 'superadmin@hirelink.in', '9876543231', '$2a$12$b/tFjZChShbXoKZCK2YqYuKr8a501ns3RXwpTUE7bB3yySv.e2ePK', 'SUPER_ADMIN', 'ACTIVE', TRUE, TRUE, 'EN', 'https://storage.hirelink.in/profiles/admin_2.jpg', 'FEMALE', '2025-01-01 00:00:00')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- USER ADDRESSES (explicit address_id added for idempotency)
-- ============================================================================
INSERT INTO user_addresses (address_id, user_id, address_type, address_label, address_line1, address_line2, landmark, city, state, pincode, latitude, longitude, is_default) VALUES
(1, 1, 'HOME', 'My Home', '42, Shanti Nagar', 'Near City Mall', 'Opposite SBI Bank', 'Bangalore', 'Karnataka', '560001', 12.9716, 77.5946, TRUE),
(2, 1, 'WORK', 'Office', 'Tech Park, Whitefield', 'Building A, Floor 5', 'Near ITPL', 'Bangalore', 'Karnataka', '560066', 12.9698, 77.7500, FALSE),
(3, 2, 'HOME', 'Home', '15, Lajpat Nagar', 'Block C', 'Near Metro Station', 'New Delhi', 'Delhi', '110024', 28.5672, 77.2432, TRUE),
(4, 3, 'HOME', 'Residence', '78, Anna Nagar', '2nd Street', 'Near Park', 'Chennai', 'Tamil Nadu', '600040', 13.0827, 80.2707, TRUE),
(5, 4, 'HOME', 'Home', '23, Sector 15', 'Chandigarh Road', 'Near Gurudwara', 'Chandigarh', 'Punjab', '160015', 30.7333, 76.7794, TRUE),
(6, 5, 'HOME', 'My Place', '56, CG Road', 'Navrangpura', 'Near Swastik Cross Road', 'Ahmedabad', 'Gujarat', '380009', 23.0300, 72.5300, TRUE),
(7, 6, 'HOME', 'Home', '89, MG Road', 'Civil Lines', 'Near Clock Tower', 'Lucknow', 'Uttar Pradesh', '226001', 26.8467, 80.9462, TRUE),
(8, 7, 'HOME', 'Residence', '34, Banjara Hills', 'Road No. 12', 'Near GVK Mall', 'Hyderabad', 'Telangana', '500034', 17.4156, 78.4347, TRUE),
(9, 8, 'HOME', 'Home', '67, Palarivattom', 'JLN Stadium Road', 'Near Lulu Mall', 'Kochi', 'Kerala', '682025', 9.9312, 76.2673, TRUE),
(10, 10, 'HOME', 'My Home', '12, FC Road', 'Shivajinagar', 'Near Ferguson College', 'Pune', 'Maharashtra', '411004', 18.5285, 73.8478, TRUE),
-- Provider business locations
(11, 11, 'WORK', 'Shop', '101, Industrial Area', 'Phase 1', 'Near Power House', 'Bangalore', 'Karnataka', '560058', 12.9352, 77.6245, TRUE),
(12, 12, 'WORK', 'Workshop', '45, Gandhi Nagar', 'Main Road', 'Near Bus Stand', 'New Delhi', 'Delhi', '110031', 28.6504, 77.2301, TRUE),
(13, 13, 'WORK', 'Furniture Shop', '78, Furniture Market', 'Kirti Nagar', 'Near Metro', 'New Delhi', 'Delhi', '110015', 28.6562, 77.1484, TRUE),
(14, 14, 'WORK', 'Service Center', '23, T Nagar', 'Pondy Bazaar', 'Near Bus Stop', 'Chennai', 'Tamil Nadu', '600017', 13.0418, 80.2341, TRUE),
(15, 15, 'WORK', 'Paint Shop', '56, Kukatpally', 'KPHB Colony', 'Near JNTU', 'Hyderabad', 'Telangana', '500072', 17.4948, 78.3996, TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SERVICE CATEGORIES
-- ============================================================================
INSERT INTO service_categories (category_id, category_name, category_slug, category_description, category_icon, parent_category_id, category_level, display_order, min_base_price, max_base_price, price_unit, is_active, is_featured) VALUES
(1, 'Electrical', 'electrical', 'All electrical repair and installation services', 'BoltIcon', NULL, 1, 1, 200, 5000, 'PER_VISIT', TRUE, TRUE),
(2, 'Plumbing', 'plumbing', 'Plumbing repair, installation and maintenance', 'WrenchScrewdriverIcon', NULL, 1, 2, 150, 3000, 'PER_VISIT', TRUE, TRUE),
(3, 'Carpentry', 'carpentry', 'Furniture repair, wood work and carpentry services', 'HomeModernIcon', NULL, 1, 3, 300, 10000, 'PER_VISIT', TRUE, TRUE),
(4, 'Cleaning', 'cleaning', 'Home and office cleaning services', 'SparklesIcon', NULL, 1, 4, 500, 5000, 'PER_VISIT', TRUE, TRUE),
(5, 'Painting', 'painting', 'Wall painting and waterproofing services', 'PaintBrushIcon', NULL, 1, 5, 15, 50, 'PER_SQFT', TRUE, TRUE),
(6, 'AC & Appliance', 'ac-appliance', 'AC, refrigerator and appliance repair', 'ComputerDesktopIcon', NULL, 1, 6, 300, 5000, 'PER_VISIT', TRUE, TRUE),
(7, 'Masonry', 'masonry', 'Construction, tile work and masonry services', 'WrenchIcon', NULL, 1, 7, 500, 50000, 'PER_VISIT', TRUE, FALSE),
(8, 'Welding', 'welding', 'Metal fabrication and welding services', 'FireIcon', NULL, 1, 8, 400, 10000, 'PER_VISIT', TRUE, FALSE),
(9, 'Pest Control', 'pest-control', 'Pest control and fumigation services', 'BugAntIcon', NULL, 1, 9, 1000, 5000, 'PER_VISIT', TRUE, FALSE),
(10, 'Home Security', 'home-security', 'CCTV, alarm and security system installation', 'ShieldCheckIcon', NULL, 1, 10, 2000, 50000, 'FIXED', TRUE, FALSE),
-- Electrical sub-categories
(11, 'Wiring & Rewiring', 'wiring-rewiring', 'Complete house wiring and rewiring', 'BoltIcon', 1, 2, 1, 500, 5000, 'PER_VISIT', TRUE, FALSE),
(12, 'Fan Installation', 'fan-installation', 'Ceiling fan and exhaust fan installation', 'BoltIcon', 1, 2, 2, 200, 500, 'PER_VISIT', TRUE, FALSE),
(13, 'Light Fitting', 'light-fitting', 'LED, chandelier and light fixture installation', 'LightBulbIcon', 1, 2, 3, 150, 1000, 'PER_VISIT', TRUE, FALSE),
(14, 'Switch & Socket', 'switch-socket', 'Switch board and socket repair/replacement', 'BoltIcon', 1, 2, 4, 100, 500, 'PER_VISIT', TRUE, FALSE),
-- Plumbing sub-categories
(15, 'Tap & Mixer', 'tap-mixer', 'Tap repair and mixer installation', 'WrenchScrewdriverIcon', 2, 2, 1, 150, 500, 'PER_VISIT', TRUE, FALSE),
(16, 'Toilet Repair', 'toilet-repair', 'Toilet, commode and flush tank repair', 'WrenchScrewdriverIcon', 2, 2, 2, 200, 1000, 'PER_VISIT', TRUE, FALSE),
(17, 'Pipe Fitting', 'pipe-fitting', 'Water pipe installation and repair', 'WrenchScrewdriverIcon', 2, 2, 3, 300, 2000, 'PER_VISIT', TRUE, FALSE),
(18, 'Water Tank', 'water-tank', 'Water tank cleaning and repair', 'WrenchScrewdriverIcon', 2, 2, 4, 500, 2000, 'PER_VISIT', TRUE, FALSE)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SERVICE PROVIDERS  (specializations is jsonb)
-- ============================================================================
INSERT INTO service_providers (provider_id, user_id, business_name, business_description, tagline, experience_years, specializations, base_latitude, base_longitude, base_pincode, service_radius_km, aadhaar_number_encrypted, pan_number_encrypted, kyc_status, kyc_verified_at, average_rating, total_ratings, total_reviews, total_bookings, completed_bookings, cancelled_bookings, completion_rate, total_earnings, is_available, availability_status, profile_completion_percentage, is_featured) VALUES
(1, 11, 'Ramesh Electrical Works', 'Expert electrical services with 15 years experience. Specializing in residential and commercial wiring, fan installation, and electrical repairs.', 'Quality electrical work guaranteed', 15, '["House Wiring", "Fan Installation", "Electrical Repairs", "MCB Installation"]', 12.9352, 77.6245, '560058', 15, 'ENC_AADHAAR_1', 'ENC_PAN_1', 'VERIFIED', '2025-05-15 10:00:00', 4.75, 156, 142, 180, 165, 5, 91.67, 425000.00, TRUE, 'ONLINE', 95, TRUE),
(2, 12, 'Suresh Plumbing Solutions', 'Professional plumbing services. Expert in pipe fitting, tap repair, and bathroom installations. Available 24x7 for emergencies.', 'Your plumbing problems solved', 12, '["Pipe Fitting", "Tap Repair", "Bathroom Installation", "Water Tank Cleaning"]', 28.6504, 77.2301, '110031', 12, 'ENC_AADHAAR_2', 'ENC_PAN_2', 'VERIFIED', '2025-05-20 11:30:00', 4.60, 98, 89, 120, 108, 4, 90.00, 285000.00, TRUE, 'ONLINE', 90, TRUE),
(3, 13, 'Mahesh Furniture & Carpentry', 'Custom furniture making and repair. Modular kitchen specialist with modern designs and quality craftsmanship.', 'Crafting your dream furniture', 20, '["Custom Furniture", "Modular Kitchen", "Wood Polishing", "Door Repair"]', 28.6562, 77.1484, '110015', 20, 'ENC_AADHAAR_3', 'ENC_PAN_3', 'VERIFIED', '2025-05-25 14:00:00', 4.85, 75, 70, 95, 88, 2, 92.63, 520000.00, TRUE, 'OFFLINE', 100, TRUE),
(4, 14, 'Lakshmi Cleaning Services', 'Professional home and office cleaning. Deep cleaning, sanitization, and regular maintenance services.', 'Sparkling clean guaranteed', 8, '["Deep Cleaning", "Office Cleaning", "Sanitization", "Regular Maintenance"]', 13.0418, 80.2341, '600017', 10, 'ENC_AADHAAR_4', 'ENC_PAN_4', 'VERIFIED', '2025-06-01 09:00:00', 4.50, 120, 108, 145, 130, 6, 89.66, 195000.00, TRUE, 'ONLINE', 85, FALSE),
(5, 15, 'Ravi Paint Works', 'Interior and exterior painting specialist. Waterproofing, texture painting, and wall designs.', 'Colors that last', 10, '["Interior Painting", "Exterior Painting", "Waterproofing", "Texture Work"]', 17.4948, 78.3996, '500072', 25, 'ENC_AADHAAR_5', 'ENC_PAN_5', 'VERIFIED', '2025-06-05 16:00:00', 4.70, 85, 78, 100, 92, 3, 92.00, 380000.00, TRUE, 'ONLINE', 92, FALSE),
(6, 16, 'Gopal AC & Refrigeration', 'AC installation, repair and servicing. All brands covered with genuine spare parts.', 'Cool solutions for hot days', 14, '["AC Installation", "AC Repair", "Refrigerator Repair", "Gas Refilling"]', 9.9312, 76.2673, '682025', 15, 'ENC_AADHAAR_6', 'ENC_PAN_6', 'VERIFIED', '2025-06-10 10:30:00', 4.65, 92, 85, 115, 105, 4, 91.30, 345000.00, TRUE, 'BUSY', 88, TRUE),
(7, 17, 'Vijay Construction & Masonry', 'All types of construction work. Tile fitting, bathroom renovation, and building repairs.', 'Building trust brick by brick', 18, '["Tile Work", "Construction", "Bathroom Renovation", "Waterproofing"]', 12.9716, 77.5946, '560001', 20, 'ENC_AADHAAR_7', 'ENC_PAN_7', 'VERIFIED', '2025-06-15 11:00:00', 4.55, 65, 60, 80, 72, 3, 90.00, 650000.00, TRUE, 'ONLINE', 90, FALSE),
(8, 18, 'Santosh Electrical Enterprise', 'Industrial and commercial electrical contractor. Authorized dealer for multiple brands.', 'Powering your business', 16, '["Industrial Wiring", "Commercial Electrical", "Generator Installation", "Solar Panel"]', 18.5285, 73.8478, '411004', 30, 'ENC_AADHAAR_8', 'ENC_PAN_8', 'VERIFIED', '2025-06-20 13:00:00', 4.40, 55, 48, 70, 60, 4, 85.71, 480000.00, TRUE, 'ONLINE', 85, FALSE),
(9, 19, 'Kiran Home Appliance Repair', 'Washing machine, microwave, and home appliance repair specialist.', 'Fix it right the first time', 6, '["Washing Machine", "Microwave Repair", "Geyser Repair", "Chimney Service"]', 12.2958, 76.6394, '570001', 10, NULL, NULL, 'PENDING', NULL, 0.00, 0, 0, 0, 0, 0, 0.00, 0.00, FALSE, 'OFFLINE', 45, FALSE),
(10, 20, 'Prakash Welding & Fabrication', 'Custom metal fabrication, gates, grills, and welding work.', 'Strong welds, stronger trust', 12, '["Gate Fabrication", "Grill Work", "Railing", "Metal Furniture"]', 22.5726, 88.3639, '700001', 15, 'ENC_AADHAAR_10', 'ENC_PAN_10', 'VERIFIED', '2025-06-25 15:00:00', 4.30, 42, 38, 55, 48, 3, 87.27, 275000.00, TRUE, 'ONLINE', 80, FALSE)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SERVICES
-- ============================================================================
INSERT INTO services (service_id, provider_id, category_id, service_name, service_description, base_price, price_type, estimated_duration_minutes, advance_booking_hours, is_active, is_featured, times_booked, average_rating) VALUES
(1, 1, 1, 'Complete House Wiring', 'Full house wiring with quality copper wires and modular switches', 5000.00, 'STARTING_FROM', 480, 24, TRUE, TRUE, 45, 4.80),
(2, 1, 12, 'Ceiling Fan Installation', 'Installation of ceiling fan with balancing', 300.00, 'FIXED', 60, 2, TRUE, FALSE, 85, 4.70),
(3, 1, 13, 'LED Light Installation', 'LED panel and tube light installation', 200.00, 'FIXED', 45, 2, TRUE, FALSE, 50, 4.75),
(4, 1, 14, 'Switch Board Repair', 'Repair and replacement of switch boards', 150.00, 'STARTING_FROM', 30, 1, TRUE, FALSE, 60, 4.65),
(5, 2, 2, 'Complete Bathroom Plumbing', 'Full bathroom plumbing installation', 3000.00, 'STARTING_FROM', 360, 24, TRUE, TRUE, 30, 4.65),
(6, 2, 15, 'Tap Repair/Replacement', 'Repair or replace any type of tap', 200.00, 'STARTING_FROM', 30, 2, TRUE, FALSE, 55, 4.55),
(7, 2, 16, 'Toilet Repair', 'Toilet seat, flush tank repair', 300.00, 'STARTING_FROM', 60, 2, TRUE, FALSE, 40, 4.60),
(8, 2, 17, 'Water Pipe Leakage', 'Fix water pipe leakage and seepage', 250.00, 'STARTING_FROM', 45, 1, TRUE, FALSE, 35, 4.70),
(9, 3, 3, 'Modular Kitchen Installation', 'Custom modular kitchen design and installation', 25000.00, 'STARTING_FROM', 2880, 72, TRUE, TRUE, 15, 4.90),
(10, 3, 3, 'Furniture Repair', 'Repair of wooden furniture', 500.00, 'STARTING_FROM', 120, 4, TRUE, FALSE, 45, 4.80),
(11, 3, 3, 'Door Repair/Installation', 'Wooden door repair and installation', 800.00, 'STARTING_FROM', 180, 4, TRUE, FALSE, 35, 4.85),
(12, 4, 4, 'Deep Home Cleaning', 'Thorough deep cleaning of entire home', 2500.00, 'STARTING_FROM', 360, 24, TRUE, TRUE, 60, 4.55),
(13, 4, 4, 'Bathroom Deep Cleaning', 'Intensive bathroom cleaning and sanitization', 500.00, 'FIXED', 90, 4, TRUE, FALSE, 50, 4.45),
(14, 4, 4, 'Kitchen Deep Cleaning', 'Kitchen cleaning including chimney', 800.00, 'FIXED', 120, 4, TRUE, FALSE, 45, 4.50),
(15, 5, 5, 'Interior Wall Painting', 'Interior painting with premium paints', 18.00, 'PER_SQFT', NULL, 48, TRUE, TRUE, 35, 4.75),
(16, 5, 5, 'Exterior Wall Painting', 'Weather-proof exterior painting', 25.00, 'PER_SQFT', NULL, 48, TRUE, FALSE, 25, 4.70),
(17, 5, 5, 'Waterproofing', 'Terrace and wall waterproofing', 35.00, 'PER_SQFT', NULL, 48, TRUE, FALSE, 20, 4.65),
(18, 6, 6, 'AC Installation', 'Split AC installation with copper piping', 1500.00, 'FIXED', 180, 24, TRUE, TRUE, 40, 4.70),
(19, 6, 6, 'AC Service & Cleaning', 'Complete AC service with gas check', 600.00, 'FIXED', 90, 4, TRUE, FALSE, 55, 4.60),
(20, 6, 6, 'AC Gas Refilling', 'AC gas refilling with leak check', 1200.00, 'STARTING_FROM', 60, 4, TRUE, FALSE, 30, 4.55),
(21, 7, 7, 'Bathroom Renovation', 'Complete bathroom renovation with tiles', 35000.00, 'STARTING_FROM', 4320, 72, TRUE, TRUE, 12, 4.60),
(22, 7, 7, 'Tile Installation', 'Floor and wall tile installation', 45.00, 'PER_SQFT', NULL, 48, TRUE, FALSE, 25, 4.55),
(23, 7, 7, 'Wall Construction', 'Brick wall construction', 80.00, 'PER_SQFT', NULL, 72, TRUE, FALSE, 18, 4.50),
(24, 8, 1, 'Industrial Wiring', 'Factory and industrial electrical work', 15000.00, 'STARTING_FROM', 960, 48, TRUE, TRUE, 20, 4.45),
(25, 8, 10, 'CCTV Installation', '4 camera CCTV setup with DVR', 12000.00, 'STARTING_FROM', 240, 24, TRUE, FALSE, 25, 4.40),
(26, 10, 8, 'Iron Gate Fabrication', 'Custom iron gate design and installation', 8000.00, 'STARTING_FROM', 480, 72, TRUE, TRUE, 18, 4.35),
(27, 10, 8, 'Window Grill', 'Safety window grill fabrication', 350.00, 'PER_SQFT', NULL, 48, TRUE, FALSE, 22, 4.30),
(28, 10, 8, 'Railing Work', 'Staircase and balcony railing', 400.00, 'PER_SQFT', NULL, 48, TRUE, FALSE, 15, 4.25)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- BOOKINGS
-- ============================================================================
INSERT INTO bookings (booking_id, booking_number, user_id, provider_id, service_id, scheduled_date, scheduled_time, service_address, service_pincode, service_latitude, service_longitude, issue_title, issue_description, urgency_level, estimated_amount, material_cost, labor_cost, final_amount, booking_status, created_at) VALUES
(1, 'HL2025080100001', 1, 1, 2, '2025-08-01', '10:00:00', '42, Shanti Nagar, Near City Mall, Bangalore', '560001', 12.9716, 77.5946, 'Ceiling Fan Not Working', 'Living room ceiling fan stopped working suddenly', 'MEDIUM', 300.00, 0.00, 300.00, 300.00, 'COMPLETED', '2025-07-30 15:30:00'),
(2, 'HL2025080200001', 2, 2, 6, '2025-08-02', '09:00:00', '15, Lajpat Nagar, Block C, New Delhi', '110024', 28.5672, 77.2432, 'Kitchen Tap Leaking', 'Kitchen tap is constantly dripping', 'HIGH', 200.00, 150.00, 200.00, 350.00, 'COMPLETED', '2025-08-01 10:00:00'),
(3, 'HL2025080500001', 3, 4, 12, '2025-08-05', '07:00:00', '78, Anna Nagar, 2nd Street, Chennai', '600040', 13.0827, 80.2707, 'Home Deep Cleaning', 'Need complete home deep cleaning before guests arrive', 'MEDIUM', 2500.00, 200.00, 2500.00, 2700.00, 'COMPLETED', '2025-08-03 11:20:00'),
(4, 'HL2025080800001', 4, 5, 15, '2025-08-08', '09:00:00', '23, Sector 15, Chandigarh Road, Chandigarh', '160015', 30.7333, 76.7794, 'Interior Painting', '2BHK apartment interior painting', 'LOW', 18000.00, 5000.00, 18000.00, 23000.00, 'COMPLETED', '2025-08-01 14:30:00'),
(5, 'HL2025081000001', 5, 6, 19, '2025-08-10', '11:00:00', '56, CG Road, Navrangpura, Ahmedabad', '380009', 23.0300, 72.5300, 'AC Service', 'AC not cooling properly, needs service', 'HIGH', 600.00, 0.00, 600.00, 600.00, 'COMPLETED', '2025-08-09 09:45:00'),
(6, 'HL2025082000001', 1, 3, 10, '2025-08-20', '10:00:00', '42, Shanti Nagar, Near City Mall, Bangalore', '560001', 12.9716, 77.5946, 'Wardrobe Door Repair', 'Bedroom wardrobe door hinge broken', 'MEDIUM', 500.00, NULL, NULL, NULL, 'IN_PROGRESS', '2025-08-18 16:00:00'),
(7, 'HL2025082100001', 7, 1, 1, '2025-08-21', '09:00:00', '34, Banjara Hills, Road No. 12, Hyderabad', '500034', 17.4156, 78.4347, 'Complete House Wiring', 'New construction house wiring work', 'LOW', 15000.00, NULL, NULL, NULL, 'IN_PROGRESS', '2025-08-15 10:30:00'),
(8, 'HL2025082500001', 8, 6, 18, '2025-08-25', '10:00:00', '67, Palarivattom, JLN Stadium Road, Kochi', '682025', 9.9312, 76.2673, 'AC Installation', 'New split AC installation in bedroom', 'MEDIUM', 1500.00, NULL, NULL, NULL, 'ACCEPTED', '2025-08-20 11:00:00'),
(9, 'HL2025082700001', 10, 7, 22, '2025-08-27', '08:00:00', '12, FC Road, Shivajinagar, Pune', '411004', 18.5285, 73.8478, 'Bathroom Tiles', 'Bathroom floor tile replacement', 'LOW', 5000.00, NULL, NULL, NULL, 'ACCEPTED', '2025-08-22 14:20:00'),
(10, 'HL2025082800001', 2, 1, 3, '2025-08-28', '14:00:00', '15, Lajpat Nagar, Block C, New Delhi', '110024', 28.5672, 77.2432, 'LED Light Installation', 'Install LED panel lights in living room', 'LOW', 400.00, NULL, NULL, NULL, 'PENDING', '2025-08-25 09:00:00'),
(11, 'HL2025081500001', 6, 2, 7, '2025-08-15', '11:00:00', '89, MG Road, Civil Lines, Lucknow', '226001', 26.8467, 80.9462, 'Toilet Repair', 'Flush not working properly', 'HIGH', 300.00, NULL, NULL, NULL, 'CANCELLED', '2025-08-13 10:00:00')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- REVIEWS
-- ============================================================================
INSERT INTO reviews (review_id, booking_id, reviewer_id, reviewee_provider_id, overall_rating, quality_rating, punctuality_rating, professionalism_rating, value_for_money_rating, review_title, review_text, is_visible, helpful_count, created_at) VALUES
(1, 1, 1, 1, 5.00, 5.00, 5.00, 5.00, 4.50, 'Excellent Service!', 'Ramesh was very professional and fixed my fan quickly. Highly recommended!', TRUE, 12, '2025-08-01 15:00:00'),
(2, 2, 2, 2, 4.50, 4.50, 4.00, 5.00, 4.50, 'Good Work', 'Suresh fixed the tap efficiently. A bit delayed but good work overall.', TRUE, 8, '2025-08-02 14:00:00'),
(3, 3, 3, 4, 4.50, 5.00, 4.50, 4.50, 4.00, 'House looks spotless!', 'Lakshmi and her team did an amazing job. Very thorough cleaning.', TRUE, 15, '2025-08-05 18:00:00'),
(4, 4, 4, 5, 5.00, 5.00, 5.00, 5.00, 4.50, 'Beautiful Paint Job', 'Ravi is a true professional. The colors look amazing and finish is perfect.', TRUE, 20, '2025-08-13 10:00:00'),
(5, 5, 5, 6, 4.00, 4.00, 4.00, 4.00, 4.00, 'AC working fine now', 'Good service, AC is cooling much better now.', TRUE, 5, '2025-08-10 16:00:00')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- REALIGN SEQUENCES so app-generated inserts continue past the seeded ids
-- ============================================================================
SELECT setval(pg_get_serial_sequence('users', 'user_id'), (SELECT MAX(user_id) FROM users));
SELECT setval(pg_get_serial_sequence('user_addresses', 'address_id'), (SELECT MAX(address_id) FROM user_addresses));
SELECT setval(pg_get_serial_sequence('service_categories', 'category_id'), (SELECT MAX(category_id) FROM service_categories));
SELECT setval(pg_get_serial_sequence('service_providers', 'provider_id'), (SELECT MAX(provider_id) FROM service_providers));
SELECT setval(pg_get_serial_sequence('services', 'service_id'), (SELECT MAX(service_id) FROM services));
SELECT setval(pg_get_serial_sequence('bookings', 'booking_id'), (SELECT MAX(booking_id) FROM bookings));
SELECT setval(pg_get_serial_sequence('reviews', 'review_id'), (SELECT MAX(review_id) FROM reviews));

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'users' AS table_name, COUNT(*) AS record_count FROM users
UNION ALL SELECT 'user_addresses', COUNT(*) FROM user_addresses
UNION ALL SELECT 'service_categories', COUNT(*) FROM service_categories
UNION ALL SELECT 'service_providers', COUNT(*) FROM service_providers
UNION ALL SELECT 'services', COUNT(*) FROM services
UNION ALL SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL SELECT 'reviews', COUNT(*) FROM reviews;
