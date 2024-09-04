// Import necessary libraries and modules
const express = require('express');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma/client');

// Change password endpoint
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;  // Use req.user.id set by verifyToken middleware

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            success: false,
            message: 'Validation error',
            errors: errors.array(),
        });
    }

    try {
        // Fetch the user from the database using the userId from req.user
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { password: true },
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Compare the current password with the stored hashed password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        
        // Update the user's password in the database
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword },
        });

        // Respond with a success message
        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


// Function to handle user login
const login = async (req, res) => {
    // Periksa hasil validasi
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Jika ada error, kembalikan error ke pengguna
        return res.status(422).json({
            success: false,
            message: 'Validation error',
            errors: errors.array(),
        });
    }
    
    try {
        // Find user including the role relation
        const user = await prisma.user.findFirst({
            where: {
                email: req.body.email,
            },
            select: {
                id: true,
                name: true,
                email: true,
                password: true,
                role: {
                    select: {
                        name: true,  // Fetch role name
                        description: true,  // Fetch role description, if needed
                    },
                },
                unitKerja: {
                    select: {
                        nama: true,  // Fetch role name
                    },
                },
            },
        });

        //console.log(user);

        // User not found
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Invalid Login',
            });
        }

        // Compare password
        const validPassword = await bcrypt.compare(req.body.password, user.password);

        // Password incorrect
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid Login',
            });
        }

        // Generate token JWT with role name
        const token = jwt.sign(
            { id: user.id, role: user.role.name },  // Include role name in the token
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Destructure to remove password from user object
        const { password, ...userWithoutPassword } = user;

        // Return response
        res.status(200).send({
            success: true,
            message: 'Login successfully',
            data: {
                user: userWithoutPassword,
                token: token,
            },
        });
    } catch (error) {
        console.error('Error during login:', error);  // Log the error for debugging
        res.status(500).send({
            success: false,
            message: 'Internal server error',
        });
    }
};

// Logout function in Express
const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
        });

        return res.status(200).json({
            success: true,
            message: 'Logout successfully',
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

module.exports = { login, logout, changePassword };
