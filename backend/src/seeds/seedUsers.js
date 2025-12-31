const bcrypt = require('bcrypt');
const { sql, pool } = require('../config/db');

const firstNames = ['John', 'Jane', 'Mike', 'Anna', 'Tom', 'Jill'];
const lastNames = ['Smith', 'Johnson', 'Brown', 'Williams', 'Miller', 'Garcia'];
const roles = ['admin', 'user'];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seedUsers(count = 30) {
  console.log('Seeding Users...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  for (let i = 1; i <= count; i++) {
    const first = randomItem(firstNames);
    const last = randomItem(lastNames);
    const role = randomItem(roles);

    // 👉 đảm bảo email KHÔNG BAO GIỜ TRÙNG
    const email = `${first.toLowerCase()}${last.toLowerCase()}_${Date.now()}_${i}@example.com`;

    try {
      await pool.request()
        .input('name', sql.VarChar, `${first} ${last}`)
        .input('email', sql.VarChar, email)
        .input('password', sql.VarChar, hashedPassword)
        .input('role', sql.VarChar, role)
        .query(`
          INSERT INTO users (uName, uEmail, uPassword, uRole)
          VALUES (@name, @email, @password, @role)
        `);

      console.log(`Created User ${i}: ${first} ${last} (${email}) - ${role}`);
    } catch (err) {
      console.error(`Failed user ${i}:`, err.message);
    }
  }

  console.log('Seed users completed successfully');
}

module.exports = seedUsers;
