const express = require('express');
const prisma = require('../prisma/client');

const getDashboardStats = async (req, res) => {
  try {
    // Fetch all units with their corresponding documents
    const units = await prisma.unitKerja.findMany({
      include: {
        users: {
          include: {
            documents: {
              where: {
                isDeleted: false, // Filter documents where isDeleted is false
              },
            },
          },
        },
      },
    });

    // Calculate statistics
    const totalUploads = units.reduce((sum, unit) => {
      return sum + unit.users.reduce((userSum, user) => userSum + user.documents.length, 0);
    }, 0);

    const stats = units.map((unit, index) => {
      const uploadsPerUnit = unit.users.reduce((sum, user) => sum + user.documents.length, 0);
      const percentage = ((uploadsPerUnit / totalUploads) * 100).toFixed(2);

      return {
        no: index + 1,
        unitKerja: unit.nama,
        jumlahUpload: uploadsPerUnit,
        persentase: `${percentage}%`,
      };
    });

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'An error occurred while fetching statistics.' });
  }
}

module.exports = {getDashboardStats};