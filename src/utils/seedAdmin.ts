import bcrypt from 'bcryptjs';
import { User } from '../models/user.model';
import { ENV } from '../config/env';
import { connectDB } from '../config/db';

export const seedAdmin = async (): Promise<void> => {
  try {
    const adminEmail = (ENV.ADMIN_EMAIL || 'admin@wedplan.com').toLowerCase();
    const adminPassword = ENV.ADMIN_PASSWORD || 'Admin123!';

    const existingAdmin = await User.findOne({
      $or: [{ role: 'admin' }, { email: adminEmail }]
    });

    if (existingAdmin) {
      // Ensure admin has role 'admin'
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log(`👑 User ${adminEmail} updated to Admin role.`);
      }
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    await User.create({
      name: 'WedPlan Administrator',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      isBlocked: false,
      subscriptionPlan: 'premium'
    });

    console.log(`👑 Default Admin account successfully seeded: ${adminEmail}`);
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
};

// If run directly via CLI
if (require.main === module) {
  (async () => {
    await connectDB();
    await seedAdmin();
    process.exit(0);
  })();
}
