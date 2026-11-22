const mongoose = require('mongoose');

const uri = 'mongodb://WedPlan:C8DOQaWOkSGX4HQl@ac-ckvpxin-shard-00-00.6yif7dp.mongodb.net:27017,ac-ckvpxin-shard-00-01.6yif7dp.mongodb.net:27017,ac-ckvpxin-shard-00-02.6yif7dp.mongodb.net:27017/?ssl=true&replicaSet=atlas-wolesy-shard-0&authSource=admin&compressors=zlib';

async function main() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  // 1. Approve all existing services (including vendor's '5 Ghontay Biye')
  const updateRes = await db.collection('services').updateMany({}, { $set: { status: 'approved' } });
  console.log('Approved existing services count:', updateRes.modifiedCount);

  // Check admin/vendor id to attach initial approved services
  const adminUser = await db.collection('users').findOne({ role: 'admin' });
  const vendorUser = await db.collection('users').findOne({ role: 'vendor' });
  const defaultOwnerId = vendorUser ? vendorUser._id : (adminUser ? adminUser._id : new mongoose.Types.ObjectId());

  const currentCount = await db.collection('services').countDocuments({});
  console.log('Current services count in DB:', currentCount);

  // If there are less than 6 services, seed realistic real approved services so Featured Wedding Services has 6 database services
  if (currentCount < 6) {
    const seedServices = [
      {
        vendorId: defaultOwnerId,
        serviceName: 'Grand Royal Palace Wedding Hall',
        category: 'Wedding Venues',
        description: 'Spectacular crystal-chandelier ballroom accommodating up to 600 guests, equipped with luxury bridal suites and ambient lighting.',
        price: 3500,
        location: 'Gulshan, Dhaka',
        images: ['https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80'],
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        vendorId: defaultOwnerId,
        serviceName: 'Aura Cinematic Photography & 4K Drone',
        category: 'Photography & Videography',
        description: 'Candid storytelling, cinematic trailer, 4K aerial drone coverage, and high-gloss heirloom wedding album.',
        price: 1600,
        location: 'Dhanmondi, Dhaka',
        images: ['https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=80'],
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        vendorId: defaultOwnerId,
        serviceName: 'Fleur & Velvet Floral Stage & Entry Décor',
        category: 'Decoration & Florist',
        description: 'Imported fresh roses, hydrangeas, customized LED neon backdrops, and fragrant walkway floral aisles.',
        price: 1200,
        location: 'Banani, Dhaka',
        images: ['https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80'],
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        vendorId: defaultOwnerId,
        serviceName: 'Nawab Gourmet Mughlai & Continental Feast',
        category: 'Catering Services',
        description: 'Authentic Kacchi Biryani, Zafrani Kababs, live dessert stations, and fresh refreshing mocktails for 300+ guests.',
        price: 2200,
        location: 'Uttara, Dhaka',
        images: ['https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80'],
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        vendorId: defaultOwnerId,
        serviceName: 'Luxe Bridal Artistry & HD Glow Makeup',
        category: 'Makeup & Styling',
        description: 'International brand makeup, customized hair design, dupatta draping, and continuous touch-up services.',
        price: 650,
        location: 'Mohakhali DOHS, Dhaka',
        images: ['https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80'],
        status: 'approved',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await db.collection('services').insertMany(seedServices);
    console.log(`Seeded ${seedServices.length} approved services to MongoDB Atlas!`);
  }

  const all = await db.collection('services').find({}).toArray();
  console.log(`\nFinal DB Services List (${all.length} total):`);
  all.forEach(s => console.log(`- [${s.status.toUpperCase()}] ${s.serviceName || s.name} ($${s.price}) in ${s.location}`));

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

