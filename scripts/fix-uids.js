const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixUIDs() {
  try {
    console.log('🔧 Fixing UID sequence...')
    
    // Get all users ordered by creation date
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        roles: true,
        profile: true
      }
    })
    
    console.log(`\n👥 Found ${users.length} users:`)
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Current UID: ${user.uid}`)
      console.log(`   Roles: ${user.roles.map(r => r.name).join(', ') || 'None'}`)
    })
    
    // Reset the UID sequence
    console.log('\n🔄 Resetting UID sequence...')
    
    // Update each user with sequential UIDs starting from 1
    for (let i = 0; i < users.length; i++) {
      const user = users[i]
      const newUID = i + 1
      
      await prisma.user.update({
        where: { id: user.id },
        data: { uid: newUID }
      })
      
      console.log(`✅ Updated ${user.name} to UID ${newUID}`)
    }
    
    // Reset the autoincrement sequence
    console.log('\n🔄 Resetting autoincrement sequence...')
    await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"User"', 'uid'), ${users.length}, true)`
    
    console.log('\n✅ UID sequence fixed!')
    console.log('🎉 All users now have sequential UIDs starting from 1')
    
  } catch (error) {
    console.error('❌ Error fixing UIDs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixUIDs()
