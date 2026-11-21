import bcrypt from 'bcryptjs';
import { User } from '../models/user.model';
import { Service } from '../models/service.model';
import { ENV } from '../config/env';
import { connectDB } from '../config/db';

export const seedAdmin = async (): Promise<void> => {
  try {
    const adminEmail = (ENV.ADMIN_EMAIL || 'admin@wedplan.com').toLowerCase();
    const adminPassword = ENV.ADMIN_PASSWORD || 'Admin123!';

    const existingAdmin = await User.findOne({
      $or: [{ role: 'admin' }, { email: adminEmail }]
    });

    if (!existingAdmin) {
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
    }

    // Seed Demo Vendor & Services if database has no services
    const servicesCount = await Service.countDocuments();
    if (servicesCount === 0) {
      let vendor = await User.findOne({ email: 'vendor@wedplan.com' });
      if (!vendor) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Vendor123!', salt);
        vendor = await User.create({
          name: 'Aura Lens Studios',
          businessName: 'Aura Lens Studios',
          email: 'vendor@wedplan.com',
          password: hashedPassword,
          role: 'vendor',
          isBlocked: false,
          subscriptionPlan: 'premium'
        });
        console.log('🌟 Demo Vendor account created: vendor@wedplan.com / Vendor123!');
      }

      await Service.create([
        {
          vendorId: vendor._id,
          serviceName: 'Cinematic Golden Hour Wedding Photography',
          category: 'Photography & Videography',
          description: 'Full-day documentary wedding photojournalism with drone aerial videography and luxury photo album.',
          price: 1850,
          location: 'Charleston, SC',
          images: ['https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=80'],
          status: 'approved'
        },
        {
          vendorId: vendor._id,
          serviceName: 'Historic Waterfront Botanical Garden Venue',
          category: 'Wedding Venues',
          description: 'Picturesque estate featuring ancient live oaks, Spanish moss, private bridal suite, and grand ballroom.',
          price: 4500,
          location: 'Savannah, GA',
          images: ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80'],
          status: 'approved'
        },
        {
          vendorId: vendor._id,
          serviceName: 'Custom Luxury Floral Arches & Centerpieces',
          category: 'Decoration & Florist',
          description: 'Artisanal ceremony floral installations, lush organic bouquets, and tablescape candle stylings.',
          price: 1200,
          location: 'Austin, TX',
          images: ['https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80'],
          status: 'approved'
        },
        {
          vendorId: vendor._id,
          serviceName: 'Gourmet 4-Course Plated Dinner & Wine Pairing',
          category: 'Catering Services',
          description: 'Locally sourced farm-to-table banquet menu with sommelier curated natural wine pairings and dessert stations.',
          price: 2400,
          location: 'Napa Valley, CA',
          images: ['https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80'],
          status: 'approved'
        },
        {
          vendorId: vendor._id,
          serviceName: 'Bridal Party Hair & Airbrush HD Makeup Package',
          category: 'Makeup & Styling',
          description: 'On-location luxury hair styling and waterproof airbrush bridal artistry for bride and bridesmaids.',
          price: 850,
          location: 'Miami, FL',
          images: ['https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80'],
          status: 'approved'
        },
        {
          vendorId: vendor._id,
          serviceName: 'Bespoke Hand-Embroidered Bridal Gown Fitting',
          category: 'Wedding Fashion',
          description: 'Custom handcrafted bridal silk gowns with French lace embroidery, bespoke veil, and tailored alterations.',
          price: 3200,
          location: 'New York, NY',
          images: ['https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=800&q=80'],
          status: 'approved'
        }
      ]);
      console.log('💍 6 Approved wedding services seeded into database!');
    }
  } catch (error) {
    console.error('Error seeding admin and services:', error);
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
