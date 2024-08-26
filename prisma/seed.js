const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
// Import bcrypt
const bcrypt = require('bcryptjs');
// Import uuid
const { v4: uuidv4 } = require('uuid');

async function main() {
    const hashedPassword = await bcrypt.hash('password', 10);
    
    await prisma.user.upsert({
        where: { email: 'admin@admin.com' },
        update: {},
        create: {
            id: uuidv4(), // Tambahkan UUID secara eksplisit
            name: 'Administrator',
            email: 'admin@admin.com',
            password: hashedPassword,
        },
    });

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
