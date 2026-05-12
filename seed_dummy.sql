-- =======================================================
-- RekaFisika — Dummy Data Seed
-- Kurikulum Merdeka: Kelas 10, 11, 12
-- Jalankan di Supabase SQL Editor
-- =======================================================

-- Step 1: Pastikan kolom kelas & kategori sudah ada
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS kelas TEXT;
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS kategori TEXT;

-- =======================================================
-- Step 2: INSERT MODUL + RANGKAIAN AJAR (dalam satu DO block)
-- =======================================================
DO $$
DECLARE
  -- ── KELAS 10 ── Kinematika
  m_glb       UUID;
  m_glbb      UUID;
  m_parabola  UUID;
  m_melingkar UUID;
  -- ── KELAS 10 ── Dinamika
  m_newton12  UUID;
  m_newton3   UUID;
  m_usaha     UUID;
  m_momentum  UUID;

  -- ── KELAS 11 ── Fluida
  m_fl_statis   UUID;
  m_fl_dinamis  UUID;
  -- ── KELAS 11 ── Termodinamika
  m_kalor       UUID;
  m_termo       UUID;
  -- ── KELAS 11 ── Gelombang
  m_ghs         UUID;
  m_gel_mekanik UUID;
  m_gel_bunyi   UUID;
  -- ── KELAS 11 ── Optik
  m_cahaya      UUID;
  m_alat_optik  UUID;

  -- ── KELAS 12 ── Listrik Statis
  m_coulomb     UUID;
  m_kapasitor   UUID;
  -- ── KELAS 12 ── Listrik Dinamis
  m_ohm         UUID;
  m_rangkaian   UUID;
  -- ── KELAS 12 ── Kemagnetan
  m_lorentz     UUID;
  m_induksi     UUID;
  -- ── KELAS 12 ── Fisika Modern
  m_relativitas UUID;
  m_kuantum     UUID;
  m_radioaktif  UUID;

  -- ── Learning Path IDs ──
  p10_mekanika  UUID;
  p10_gerak     UUID;
  p11_fluida    UUID;
  p11_gelombang UUID;
  p12_listrik   UUID;
  p12_modern    UUID;

BEGIN

  -- ============================================================
  --  KELAS 10
  -- ============================================================

  -- Kategori: Kinematika
  INSERT INTO public.modules (topic, description, kelas, kategori, sort_order, steps, is_visible, is_locked)
  VALUES ('Gerak Lurus Beraturan (GLB)', 'Mempelajari konsep benda yang bergerak dengan kecepatan konstan pada lintasan lurus. Dilengkapi grafik v-t dan s-t.', 'Kelas 10', 'Kinematika', 101, '[]', true, false)
  RETURNING id INTO m_glb;

  INSERT INTO public.modules (topic, description, kelas, kategori, sort_order, steps, is_visible, is_locked)
  VALUES ('Gerak Lurus Berubah Beraturan (GLBB)', 'Menganalisis gerak dengan percepatan konstan: gerak jatuh bebas, gerak vertikal ke atas, dan grafik kinematika.', 'Kelas 10', 'Kinematika', 102, '[]', true, false)
  RETURNING id INTO m_glbb;

  INSERT INTO public.modules (topic, description, kelas, kategori, sort_order, steps, is_visible, is_locked)
  VALUES ('Gerak Parabola', 'Menguraikan gerak peluru sebagai kombinasi GLB horizontal dan GLBB vertikal. Simulasi lintasan parabola.', 'Kelas 10', 'Kinematika', 103, '[]', true, false)
  RETURNING id INTO m_parabola;

  INSERT INTO public.modules (topic, description, kelas, kategori, sort_order, steps, is_visible, is_locked)
  VALUES ('Gerak Melingkar', 'Konsep kecepatan sudut, percepatan sentripetal, dan hubungan roda-roda pada gerak melingkar beraturan.', 'Kelas 10', 'Kinematika', 104, '[]', true, false)
  RETURNING id INTO m_melingkar;

  -- Kategori: Dinamika
  INSERT INTO public.modules (topic, description, kelas, kategori, sort_order, steps, is_visible, is_locked)
  VALUES ('Hukum Newton I & II', 'Memahami inersia, resultan gaya, dan hubungan gaya-massa-percepatan melalui simulasi PhET Forces and Motion.', 'Kelas 10', 'Dinamika', 105, '[]', true, false)
  RETURNING id INTO m_newton12;

  INSERT INTO public.modules (topic, description, kelas, kategori, sort_order, steps, is_visible, is_locked)
  VALUES ('Hukum Newton III & Gaya Gesek', 'Menganalisis pasangan aksi-reaksi dan pengaruh gaya gesek statis serta kinetis dalam kehidupan sehari-hari.', 'Kelas 10', 'Dinamika', 106, '[]', true, false)
  RETURNING id INTO m_newton3;

  INSERT INTO public.modules (topic, description, kelas, kategori, sort_order, steps, is_visible, is_locked)
  VALUES ('Usaha dan Energi', 'Konsep usaha, energi kinetik, energi potensial, dan hukum kekekalan energi mekanik dengan latihan soal kontekstual.', 'Kelas 10', 'Dinamika', 107, '[]', true, false)
  RETURNING id INTO m_usaha;

  INSERT INTO public.modules (topic, description, kelas, kategori, sort_order, steps, is_visible, is_locked)
  VALUES ('Momentum dan Impuls', 'Memahami momentum linear, impuls, dan hukum kekekalan momentum pada tumbukan lenting dan tidak lenting.', 'Kelas 10', 'Dinamika', 108, '[]', true, false)
  RETURNING id INTO m_momentum;

  -- ============================================================
  --  KELAS 11
  -- ============================================================

  -- Kategori: Fluida
  INSERT INTO public.modules (topic, description, kelas, kategori, sort_order, steps, is_visible, is_locked)
  VALUES ('Fluida Statis', 'Tekanan hidrostatis, hukum Pascal, hukum Archimedes, dan tegangan permukaan. Simulasi kapal selam dan balon udara.', 'Kelas 11', 'Fluida', 201, '[]', true, false)
  RETURNING id INTO m_fl_statis;

  INSERT INTO public.modules (topic, description, kelas, kategori, sort_order, steps, is_visible, is_locked)
  VALUES ('Fluida Dinamis', 'Persamaan kontinuitas, persamaan Bernoulli, dan penerapannya pada sayap pesawat, venturimeter, dan pipa pitot.', 'Kelas 11', 'Fluida', 202, '[]', true, false)
  RETURNING id INTO m_fl_dinamis;

  -- Kategori: Termodinamika
  INSERT INTO public.modules (topic, description, kelas, kategori, sort_order, steps, is_visible, is_locked)
  VALUES ('Suhu dan Kalor', 'Skala termometer, pemuaian zat, kalor jenis, kalorimetri, perpindahan kalor (konduksi, konveksi, radiasi).', 'Kelas 11', 'Termodinamika', 203, '[]', true, false)
  RETURNING id INTO m_kalor;

  INSERT INTO public.modules (topic, description, kelas, kategori, sort_order, steps, is_visible, is_locked)
  VALUES ('Hukum-Hukum Termodinamika', 'Proses isotermal, isobarik, isokhorik, dan adiabatik. Siklus Carnot dan efisiensi mesin kalor.', 'Kelas 11', 'Termodinamika', 204, '[]', true, false)
  RETURNING id INTO m_termo;

  -- Kategori: Getaran & Gelombang
  INSERT INTO public.modules (topic, description, kelas, kategori, sort_order, steps, is_visible, is_locked)
  VALUES ('Getaran Harmonik Sederhana', 'Simpangan, kecepatan, percepatan pada GHS. Pegas dan bandul matematis sebagai contoh nyata.', 'Kelas 11', 'Getaran & Gelombang', 205, '[]', true, false)
  RETURNING id INTO m_ghs;

  INSERT INTO public.modules (topic, description, kelas, kategori, sort_order, steps, is_visible, is_locked)
  VALUES ('Gelombang Mekanik', 'Karakteristik gelombang: panjang gelombang, frekuensi, cepat rambat. Gelombang transversal dan longitudinal.', 'Kelas 11', 'Getaran & Gelombang', 206, '[]', true, false)
  RETURNING id INTO m_gel_mekanik;

  INSERT INTO public.modules (topic, description, kelas, kategori, sort_order, steps, is_visible, is_locked)
  VALUES ('Gelombang Bunyi', 'Cepat rambat bunyi, efek Doppler, intensitas dan taraf intensitas bunyi, resonansi kolom udara.', 'Kelas 11', 'Getaran & Gelombang', 207, '[]', true, false)
  RETURNING id INTO m_gel_bunyi;

  -- Kategori: Optik
  INSERT INTO public.modules (topic, description, kelas, kategori, sort_order, steps, is_visible, is_locked)
  VALUES ('Pemantulan & Pembiasan Cahaya', 'Hukum Snellius, pemantulan total, dan pembentukan bayangan pada cermin datar, cekung, dan cembung.', 'Kelas 11', 'Optik', 208, '[]', true, false)
  RETURNING id INTO m_cahaya;

  INSERT INTO public.modules (topic, description, kelas, kategori, sort_order, steps, is_visible, is_locked)
  VALUES ('Alat-Alat Optik', 'Lup, mikroskop, teleskop, kamera, dan koreksi cacat mata. Simulasi interaktif pembentukan bayangan.', 'Kelas 11', 'Optik', 209, '[]', true, false)
  RETURNING id INTO m_alat_optik;

  -- ============================================================
  --  KELAS 12
  -- ============================================================

  -- Kategori: Listrik Statis
  INSERT INTO public.modules (topic, description, kelas, kategori, sort_order, steps, is_visible, is_locked)
  VALUES ('Hukum Coulomb & Medan Listrik', 'Gaya interaksi muatan listrik, medan listrik, garis-garis medan, dan potensial listrik titik.', 'Kelas 12', 'Listrik Statis', 301, '[]', true, false)
  RETURNING id INTO m_coulomb;

  INSERT INTO public.modules (topic, description, kelas, kategori, sort_order, steps, is_visible, is_locked)
  VALUES ('Kapasitor & Energi Listrik', 'Kapasitor keping sejajar, kapasitas, energi yang tersimpan, susunan kapasitor seri dan paralel.', 'Kelas 12', 'Listrik Statis', 302, '[]', true, false)
  RETURNING id INTO m_kapasitor;

  -- Kategori: Listrik Dinamis
  INSERT INTO public.modules (topic, description, kelas, kategori, sort_order, steps, is_visible, is_locked)
  VALUES ('Hukum Ohm & Hambatan', 'Arus listrik, hambatan, hukum Ohm, hambatan jenis, dan faktor-faktor yang mempengaruhi hambatan konduktor.', 'Kelas 12', 'Listrik Dinamis', 303, '[]', true, false)
  RETURNING id INTO m_ohm;

  INSERT INTO public.modules (topic, description, kelas, kategori, sort_order, steps, is_visible, is_locked)
  VALUES ('Rangkaian Listrik & Hukum Kirchhoff', 'Susunan seri-paralel resistor, hukum Kirchhoff I (arus) dan II (tegangan), analisis rangkaian kompleks.', 'Kelas 12', 'Listrik Dinamis', 304, '[]', true, false)
  RETURNING id INTO m_rangkaian;

  -- Kategori: Kemagnetan
  INSERT INTO public.modules (topic, description, kelas, kategori, sort_order, steps, is_visible, is_locked)
  VALUES ('Medan Magnet & Gaya Lorentz', 'Medan magnet kawat lurus, melingkar, dan solenoida. Gaya Lorentz pada muatan dan kawat berarus.', 'Kelas 12', 'Kemagnetan', 305, '[]', true, false)
  RETURNING id INTO m_lorentz;

  INSERT INTO public.modules (topic, description, kelas, kategori, sort_order, steps, is_visible, is_locked)
  VALUES ('Induksi Elektromagnetik & GGL', 'Hukum Faraday, hukum Lenz, GGL induksi, induktansi diri, transformator, dan generator.', 'Kelas 12', 'Kemagnetan', 306, '[]', true, false)
  RETURNING id INTO m_induksi;

  -- Kategori: Fisika Modern
  INSERT INTO public.modules (topic, description, kelas, kategori, sort_order, steps, is_visible, is_locked)
  VALUES ('Teori Relativitas Khusus', 'Postulat Einstein, dilatasi waktu, kontraksi panjang, dan kesetaraan massa-energi (E=mc²).', 'Kelas 12', 'Fisika Modern', 307, '[]', true, false)
  RETURNING id INTO m_relativitas;

  INSERT INTO public.modules (topic, description, kelas, kategori, sort_order, steps, is_visible, is_locked)
  VALUES ('Efek Fotolistrik & Fisika Kuantum', 'Model atom Bohr, dualisme gelombang-partikel, efek fotolistrik, dan spektrum atom hidrogen.', 'Kelas 12', 'Fisika Modern', 308, '[]', true, false)
  RETURNING id INTO m_kuantum;

  INSERT INTO public.modules (topic, description, kelas, kategori, sort_order, steps, is_visible, is_locked)
  VALUES ('Inti Atom & Radioaktivitas', 'Struktur inti atom, peluruhan radioaktif (alfa, beta, gamma), waktu paruh, reaksi fisi dan fusi nuklir.', 'Kelas 12', 'Fisika Modern', 309, '[]', true, false)
  RETURNING id INTO m_radioaktif;

  -- ============================================================
  --  RANGKAIAN AJAR (Learning Paths)
  -- ============================================================

  -- ── Kelas 10: Path 1 ──
  INSERT INTO public.learning_paths (title, description, is_visible, reflection_questions)
  VALUES (
    'Mekanika Dasar — Kelas 10',
    'Alur pembelajaran mekanika dari gerak lurus hingga hukum Newton dan usaha energi. Cocok sebagai fondasi fisika Kelas 10.',
    true,
    ARRAY['Apa kesulitan terbesar yang kamu temukan dalam materi mekanika?', 'Contoh penerapan hukum Newton apa yang paling kamu pahami?']
  ) RETURNING id INTO p10_mekanika;

  INSERT INTO public.learning_path_modules (path_id, module_id, order_index) VALUES
    (p10_mekanika, m_glb,      1),
    (p10_mekanika, m_glbb,     2),
    (p10_mekanika, m_newton12, 3),
    (p10_mekanika, m_newton3,  4),
    (p10_mekanika, m_usaha,    5);

  -- ── Kelas 10: Path 2 ──
  INSERT INTO public.learning_paths (title, description, is_visible, reflection_questions)
  VALUES (
    'Gerak & Momentum — Kelas 10',
    'Rangkaian materi gerak dua dimensi dan momentum. Membahas gerak parabola, melingkar, dan tumbukan.',
    true,
    ARRAY['Bagaimana hubungan momentum dan impuls dalam kejadian sehari-hari?', 'Apa yang dimaksud tumbukan lenting sempurna?']
  ) RETURNING id INTO p10_gerak;

  INSERT INTO public.learning_path_modules (path_id, module_id, order_index) VALUES
    (p10_gerak, m_parabola,  1),
    (p10_gerak, m_melingkar, 2),
    (p10_gerak, m_momentum,  3);

  -- ── Kelas 11: Path 1 ──
  INSERT INTO public.learning_paths (title, description, is_visible, reflection_questions)
  VALUES (
    'Fluida & Termodinamika — Kelas 11',
    'Dari tekanan zat cair hingga mesin kalor Carnot. Rangkaian lengkap untuk memahami sifat fluida dan energi panas.',
    true,
    ARRAY['Bagaimana prinsip Archimedes diterapkan pada kapal selam?', 'Mengapa mesin kalor tidak bisa memiliki efisiensi 100%?']
  ) RETURNING id INTO p11_fluida;

  INSERT INTO public.learning_path_modules (path_id, module_id, order_index) VALUES
    (p11_fluida, m_fl_statis,  1),
    (p11_fluida, m_fl_dinamis, 2),
    (p11_fluida, m_kalor,      3),
    (p11_fluida, m_termo,      4);

  -- ── Kelas 11: Path 2 ──
  INSERT INTO public.learning_paths (title, description, is_visible, reflection_questions)
  VALUES (
    'Gelombang & Optik — Kelas 11',
    'Alur dari getaran harmonik sederhana hingga alat optik. Membangun pemahaman tentang fenomena gelombang secara menyeluruh.',
    true,
    ARRAY['Apa perbedaan gelombang transversal dan longitudinal?', 'Bagaimana efek Doppler terjadi pada ambulans yang melintas?']
  ) RETURNING id INTO p11_gelombang;

  INSERT INTO public.learning_path_modules (path_id, module_id, order_index) VALUES
    (p11_gelombang, m_ghs,         1),
    (p11_gelombang, m_gel_mekanik, 2),
    (p11_gelombang, m_gel_bunyi,   3),
    (p11_gelombang, m_cahaya,      4),
    (p11_gelombang, m_alat_optik,  5);

  -- ── Kelas 12: Path 1 ──
  INSERT INTO public.learning_paths (title, description, is_visible, reflection_questions)
  VALUES (
    'Kelistrikan Lengkap — Kelas 12',
    'Dari muatan listrik statis hingga rangkaian dinamis. Rangkaian terpadu untuk menguasai konsep listrik secara menyeluruh.',
    true,
    ARRAY['Apa perbedaan muatan listrik statis dan dinamis?', 'Bagaimana hukum Kirchhoff membantu menganalisis rangkaian kompleks?']
  ) RETURNING id INTO p12_listrik;

  INSERT INTO public.learning_path_modules (path_id, module_id, order_index) VALUES
    (p12_listrik, m_coulomb,   1),
    (p12_listrik, m_kapasitor, 2),
    (p12_listrik, m_ohm,       3),
    (p12_listrik, m_rangkaian, 4);

  -- ── Kelas 12: Path 2 ──
  INSERT INTO public.learning_paths (title, description, is_visible, reflection_questions)
  VALUES (
    'Elektromagnetik & Fisika Modern — Kelas 12',
    'Perjalanan dari gaya Lorentz hingga fisika kuantum dan radioaktivitas. Materi ujian akhir yang paling menantang.',
    true,
    ARRAY['Mengapa induksi elektromagnetik sangat penting bagi kehidupan modern?', 'Apa implikasi teori relativitas Einstein terhadap perjalanan luar angkasa?']
  ) RETURNING id INTO p12_modern;

  INSERT INTO public.learning_path_modules (path_id, module_id, order_index) VALUES
    (p12_modern, m_lorentz,    1),
    (p12_modern, m_induksi,    2),
    (p12_modern, m_relativitas,3),
    (p12_modern, m_kuantum,    4),
    (p12_modern, m_radioaktif, 5);

  RAISE NOTICE 'Seed berhasil! 27 modul + 6 rangkaian ajar telah dibuat.';
END $$;
