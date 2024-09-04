const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function main() {
  // Seed data untuk UnitKerja
  const unitKerjas = [
    { id: uuidv4(), nama: 'Inspektorat' },
    { id: uuidv4(), nama: 'Biro Perencanaan, Sumber Daya Manusia Dan Organisasi' },
    { id: uuidv4(), nama: 'Biro Hukum, Hubungan Masyarakat Dan Kerjasama' },
    { id: uuidv4(), nama: 'Biro Umum Dan Keuangan' },
    { id: uuidv4(), nama: 'Direktorat Sistem Referensi Geospasial' },
    { id: uuidv4(), nama: 'Direktorat Pemetaan Rupabumi Wilayah Darat' },
    { id: uuidv4(), nama: 'Direktorat Pemetaan Rupabumi Wilayah Laut Dan Pantai' },
    { id: uuidv4(), nama: 'Direktorat Pemetaan Batas Wilayah Dan Nama Rupabumi' },
    { id: uuidv4(), nama: 'Direktorat Pemetaan Tematik' },
    { id: uuidv4(), nama: 'Direktorat Atlas Dan Penggunaan Informasi Geospasial' },
    { id: uuidv4(), nama: 'Direktorat Integrasi Dan Sinkronisasi Informasi Geospasial Tematik' },
    { id: uuidv4(), nama: 'Direktorat Sumber Daya Manusia Informasi Geospasial' },
    { id: uuidv4(), nama: 'Direktorat Kelembagaan Dan Jaringan Informasi Geospasial' },
    { id: uuidv4(), nama: 'Direktorat Standar Dan Teknologi Informasi Geospasial' },
    { id: uuidv4(), nama: 'Pusat Pengembangan Kompetensi Informasi Geospasial' },
    { id: uuidv4(), nama: 'Bagian Tata Usaha dan Protokol' },
    { id: uuidv4(), nama: 'Bagian Umum dan LP' },
    { id: uuidv4(), nama: 'Balai Layanan Jasa dan Produk' },
    { id: uuidv4(), nama: 'Balai Geospasial Pesisir dan Gumuk Pasir' },
    { id: uuidv4(), nama: 'Subbag TU Sekretaris Utama' },
    { id: uuidv4(), nama: 'Subbag TU Informasi Geospasial Dasar' },
    { id: uuidv4(), nama: 'Subbag TU Informasi Geospasial Tematik' },
    { id: uuidv4(), nama: 'Subbag TU Infrastruktur Informasi Geospasial' },
  ];

  // Upsert UnitKerja
  for (const unit of unitKerjas) {
    await prisma.unitKerja.upsert({
      where: { id: unit.id },
      update: {},
      create: unit,
    });
  }

  // Seed data untuk Role
  const roles = [
    { id: uuidv4(), name: 'Superuser', description: 'Memiliki akses penuh ke semua fitur' },
    { id: uuidv4(), name: 'Administrator', description: 'Mengelola data pengguna dan dokumen dalam unit kerja' },
    { id: uuidv4(), name: 'TU', description: 'Mengelola dokumen dalam unit kerja, tetapi tidak dapat menghapus' },
    { id: uuidv4(), name: 'Operator', description: 'Hanya dapat mengakses dokumen di unit kerja' },
  ];

  // Upsert Role
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  // Seed data untuk User
  const users = [
    {
      email: 'superuser@big.go.id',
      name: 'Superuser',
      roleId: roles[0].id, // Referensi ke UUID role 'Superuser'
      unitKerjaId: unitKerjas[14].id, // Referensi ke UUID unit kerja 'STIG'
      password: 'superpassword', // Password khusus untuk pengguna ini
    },
    {
      email: 'admin@big.go.id',
      name: 'Administrator',
      roleId: roles[1].id, // Referensi ke UUID role 'Administrator'
      unitKerjaId: unitKerjas[2].id, // Referensi ke UUID unit kerja 'Biro UK'
      password: 'adminpassword', // Password khusus untuk pengguna ini
    },
    {
      email: 'tu_inspektorat@big.go.id',
      name: 'Inspektorat',
      roleId: roles[2].id, // Referensi ke UUID role 'TU'
      unitKerjaId: unitKerjas[0].id, // Referensi ke UUID unit kerja 'Inspektorat'
      password: 'tupassword',
    },
    {
      email: 'tu_psdmo@big.go.id',
      name: 'Biro Perencanaan, Sumber Daya Manusia Dan Organisasi',
      roleId: roles[2].id, // Referensi ke UUID role 'TU'
      unitKerjaId: unitKerjas[1].id, // Referensi ke UUID unit kerja 'Biro Perencanaan, Sumber Daya Manusia Dan Organisasi'
      password: 'tupassword',
    },
    {
      email: 'tu_hhmk@big.go.id',
      name: 'Biro Hukum, Hubungan Masyarakat Dan Kerjasama',
      roleId: roles[2].id, // Referensi ke UUID role 'TU'
      unitKerjaId: unitKerjas[2].id, // Referensi ke UUID unit kerja 'Biro Hukum, Hubungan Masyarakat Dan Kerjasama'
      password: 'tupassword',
    },
    {
      email: 'tu_uk@big.go.id',
      name: 'Biro Umum Dan Keuangan',
      roleId: roles[2].id, // Referensi ke UUID role 'TU'
      unitKerjaId: unitKerjas[3].id, // Referensi ke UUID unit kerja 'Biro Umum Dan Keuangan'
      password: 'tupassword',
    },
    {
      email: 'tu_srg@big.go.id',
      name: 'Direktorat Sistem Referensi Geospasial',
      roleId: roles[2].id, // Referensi ke UUID role 'TU'
      unitKerjaId: unitKerjas[4].id, // Referensi ke UUID unit kerja 'Direktorat Sistem Referensi Geospasial'
      password: 'tupassword',
    },
    {
      email: 'tu_prwd@big.go.id',
      name: 'Direktorat Pemetaan Rupabumi Wilayah Darat',
      roleId: roles[2].id, // Referensi ke UUID role 'TU'
      unitKerjaId: unitKerjas[5].id, // Referensi ke UUID unit kerja 'Direktorat Pemetaan Rupabumi Wilayah Darat'
      password: 'tupassword',
    },
    {
      email: 'tu_prwlpd@big.go.id',
      name: 'Direktorat Pemetaan Rupabumi Wilayah Laut Dan Pantai',
      roleId: roles[2].id, // Referensi ke UUID role 'TU'
      unitKerjaId: unitKerjas[6].id, // Referensi ke UUID unit kerja 'Direktorat Pemetaan Rupabumi Wilayah Laut Dan Pantai'
      password: 'tupassword',
    },
    {
      email: 'tu_pbwnr@big.go.id',
      name: 'Direktorat Pemetaan Batas Wilayah Dan Nama Rupabumi',
      roleId: roles[2].id, // Referensi ke UUID role 'TU'
      unitKerjaId: unitKerjas[7].id, // Referensi ke UUID unit kerja 'Direktorat Pemetaan Batas Wilayah Dan Nama Rupabumi'
      password: 'tupassword',
    },
    {
      email: 'tu_pnt@big.go.id',
      name: 'Direktorat Pemetaan Tematik',
      roleId: roles[2].id, // Referensi ke UUID role 'TU'
      unitKerjaId: unitKerjas[8].id, // Referensi ke UUID unit kerja 'Direktorat Pemetaan Tematik'
      password: 'tupassword',
    },
    {
      email: 'tu_apig@big.go.id',
      name: 'Direktorat Atlas Dan Penggunaan Informasi Geospasial',
      roleId: roles[2].id, // Referensi ke UUID role 'TU'
      unitKerjaId: unitKerjas[9].id, // Referensi ke UUID unit kerja 'Direktorat Atlas Dan Penggunaan Informasi Geospasial'
      password: 'tupassword',
    },
    {
      email: 'tu_isigt@big.go.id',
      name: 'Direktorat Integrasi Dan Sinkronisasi Informasi Geospasial',
      roleId: roles[2].id, // Referensi ke UUID role 'TU'
      unitKerjaId: unitKerjas[10].id, // Referensi ke UUID unit kerja 'Direktorat Integrasi Dan Sinkronisasi Informasi Geospasial'
      password: 'tupassword',
    },
    {
      email: 'tu_sdmig@big.go.id',
      name: 'Direktorat Sumber Daya Manusia Informasi Geospasial',
      roleId: roles[2].id, // Referensi ke UUID role 'TU'
      unitKerjaId: unitKerjas[11].id, // Referensi ke UUID unit kerja 'Direktorat Sumber Daya Manusia Informasi Geospasial'
      password: 'tupassword',
    },
    {
      email: 'tu_kjig@big.go.id',
      name: 'Direktorat Kelembagaan Dan Jaringan Informasi Geospasial',
      roleId: roles[2].id, // Referensi ke UUID role 'TU'
      unitKerjaId: unitKerjas[12].id, // Referensi ke UUID unit kerja 'Direktorat Kelembagaan Dan Jaringan Informasi Geospasial'
      password: 'tupassword',
    },
    {
      email: 'tustig@big.go.id',
      name: 'Direktorat Standar Dan Teknologi Informasi Geospasial',
      roleId: roles[2].id, // Referensi ke UUID role 'TU'
      unitKerjaId: unitKerjas[13].id, // Referensi ke UUID unit kerja 'Direktorat Standar Dan Teknologi Informasi Geospasial'
      password: 'tupassword',
    },
    {
      email: 'tu_kkig@big.go.id',
      name: 'Pusat Pengembangan Kompetensi Informasi Geospasial',
      roleId: roles[2].id, // Referensi ke UUID role 'TU'
      unitKerjaId: unitKerjas[14].id, // Referensi ke UUID unit kerja 'Pusat Pengembangan Kompetensi Informasi Geospasial'
      password: 'tupassword',
    },
    {
      email: 'tu_protokol@big.go.id',
      name: 'Bagian Tata Usaha dan Protokol',
      roleId: roles[2].id, // Referensi ke UUID role 'TU'
      unitKerjaId: unitKerjas[15].id, // Referensi ke UUID unit kerja 'Bagian Tata Usaha dan Protokol'
      password: 'tupassword',
    },
    {
      email: 'tu_umum@big.go.id',
      name: 'Bagian Umum dan LP',
      roleId: roles[2].id, // Referensi ke UUID role 'TU'
      unitKerjaId: unitKerjas[16].id, // Referensi ke UUID unit kerja 'Bagian Umum dan LP'
      password: 'tupassword',
    },
    {
      email: 'tu_produk@big.go.id',
      name: 'Balai Layanan Jasa dan Produk',
      roleId: roles[2].id, // Referensi ke UUID role 'TU'
      unitKerjaId: unitKerjas[17].id, // Referensi ke UUID unit kerja 'Balai Layanan Jasa dan Produk'
      password: 'tupassword',
    },
    {
      email: 'tu_pasir@big.go.id',
      name: 'Balai Geospasial Pesisir dan Gumuk Pasir',
      roleId: roles[2].id, // Referensi ke UUID role 'TU'
      unitKerjaId: unitKerjas[18].id, // Referensi ke UUID unit kerja 'Balai Geospasial Pesisir dan Gumuk Pasir'
      password: 'tupassword',
    },
    {
      email: 'tu_utama@big.go.id',
      name: 'Subbag TU Sekretaris Utama',
      roleId: roles[2].id, // Referensi ke UUID role 'TU'
      unitKerjaId: unitKerjas[19].id, // Referensi ke UUID unit kerja 'Subbag TU Sekretaris Utama'
      password: 'tupassword',
    },
    {
      email: 'tu_igd@big.go.id',
      name: 'Subbag TU IGD',
      roleId: roles[2].id, // Referensi ke UUID role 'TU'
      unitKerjaId: unitKerjas[20].id, // Referensi ke UUID unit kerja 'Subbag TU IGD'
      password: 'tupassword',
    },
    {
      email: 'tu_igt@big.go.id',
      name: 'Subbag TU IGT',
      roleId: roles[2].id, // Referensi ke UUID role 'TU'
      unitKerjaId: unitKerjas[21].id, // Referensi ke UUID unit kerja 'Subbag TU IGT'
      password: 'tupassword',
    },
    {
      email: 'tu_iig@big.go.id',
      name: 'Subbag TU IIG',
      roleId: roles[2].id, // Referensi ke UUID role 'TU'
      unitKerjaId: unitKerjas[22].id, // Referensi ke UUID unit kerja 'Subbag TU IIG'
      password: 'tupassword',
    }
  ];

  // Upsert User
  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        id: uuidv4(),
        name: user.name,
        email: user.email,
        password: hashedPassword,
        roleId: user.roleId,
        unitKerjaId: user.unitKerjaId,
      },
    });
  }

  console.log('Seed data has been inserted successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
