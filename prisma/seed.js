// prisma/seed.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
//import bcrypt
const bcrypt = require('bcryptjs');

async function main() {
    const hashedPassword = await bcrypt.hash('password', 10);
    
    await prisma.user.upsert({
        where: { email: 'admin@admin.com' },
        update: {},
        create: {
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
