import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Festy5 database...')

  // Clear existing data
  await prisma.weeklyUpdate.deleteMany()
  await prisma.deliverable.deleteMany()
  await prisma.sponsor.deleteMany()
  await prisma.event.deleteMany()
  await prisma.fest.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  const festHeadPassword = await bcrypt.hash('festhead123', 10)
  const eventHeadPassword = await bcrypt.hash('eventhead123', 10)
  const sponsorLeadPassword = await bcrypt.hash('sponsorlead123', 10)

  const festHead = await prisma.user.create({
    data: {
      name: 'Arjun Sharma',
      email: 'arjun@techfest.edu',
      password: festHeadPassword,
      role: 'FestHead',
    },
  })

  const eventHead1 = await prisma.user.create({
    data: {
      name: 'Priya Nair',
      email: 'priya@techfest.edu',
      password: eventHeadPassword,
      role: 'EventHead',
    },
  })

  const eventHead2 = await prisma.user.create({
    data: {
      name: 'Rohan Mehra',
      email: 'rohan@techfest.edu',
      password: await bcrypt.hash('rohan123', 10),
      role: 'EventHead',
    },
  })

  const sponsorLead1 = await prisma.user.create({
    data: {
      name: 'Kavya Reddy',
      email: 'kavya@techfest.edu',
      password: sponsorLeadPassword,
      role: 'SponsorshipLead',
    },
  })

  const sponsorLead2 = await prisma.user.create({
    data: {
      name: 'Aditya Kumar',
      email: 'aditya@techfest.edu',
      password: await bcrypt.hash('aditya123', 10),
      role: 'SponsorshipLead',
    },
  })

  console.log('✅ Users created')

  // Create Fest
  const fest = await prisma.fest.create({
    data: {
      fest_name: 'TechFest 2025',
      prep_start_date: new Date('2025-01-01'),
      fest_start_date: new Date('2025-03-01'),
      fest_end_date: new Date('2025-03-02'),
      total_sponsorship_target: 2500000,
    },
  })

  console.log('✅ Fest created')

  // Create Events
  const hackathon = await prisma.event.create({
    data: {
      fest_id: fest.id,
      event_name: 'National Hackathon',
      event_head_id: eventHead1.id,
      sponsorship_target: 800000,
      status: 'Active',
    },
  })

  const culturalNight = await prisma.event.create({
    data: {
      fest_id: fest.id,
      event_name: 'Cultural Night',
      event_head_id: eventHead2.id,
      sponsorship_target: 600000,
      status: 'Active',
    },
  })

  const robotics = await prisma.event.create({
    data: {
      fest_id: fest.id,
      event_name: 'Robotics Olympiad',
      event_head_id: eventHead1.id,
      sponsorship_target: 500000,
      status: 'Planning',
    },
  })

  const startup = await prisma.event.create({
    data: {
      fest_id: fest.id,
      event_name: 'Startup Pitch',
      event_head_id: eventHead2.id,
      sponsorship_target: 400000,
      status: 'Active',
    },
  })

  const gaming = await prisma.event.create({
    data: {
      fest_id: fest.id,
      event_name: 'Gaming Tournament',
      event_head_id: eventHead1.id,
      sponsorship_target: 200000,
      status: 'Completed',
    },
  })

  console.log('✅ Events created')

  // Dates for testing "Needs Update" (some old, some fresh)
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)

  // Create Sponsors
  const sponsor1 = await prisma.sponsor.create({
    data: {
      sponsor_name: 'Google India',
      linked_event_id: hackathon.id,
      owner_id: sponsorLead1.id,
      expected_amount: 500000,
      probability_percentage: 80,
      stage: 'Negotiation',
      notes: 'Had strong initial call. Legal reviewing NDA. Follow up Friday.',
      last_updated_at: threeDaysAgo,
    },
  })

  const sponsor2 = await prisma.sponsor.create({
    data: {
      sponsor_name: 'Microsoft Azure',
      linked_event_id: hackathon.id,
      owner_id: sponsorLead1.id,
      expected_amount: 300000,
      probability_percentage: 60,
      stage: 'InDiscussion',
      notes: 'Interested in cloud credits + logo branding combo.',
      last_updated_at: threeDaysAgo,
    },
  })

  const sponsor3 = await prisma.sponsor.create({
    data: {
      sponsor_name: 'Zomato',
      linked_event_id: culturalNight.id,
      owner_id: sponsorLead2.id,
      expected_amount: 200000,
      probability_percentage: 90,
      stage: 'ClosedWon',
      notes: 'Contract signed. Stalls confirmed.',
      last_updated_at: yesterday,
    },
  })

  const sponsor4 = await prisma.sponsor.create({
    data: {
      sponsor_name: 'Swiggy',
      linked_event_id: culturalNight.id,
      owner_id: sponsorLead2.id,
      expected_amount: 150000,
      probability_percentage: 40,
      stage: 'Contacted',
      notes: 'Sent deck. Awaiting response.',
      last_updated_at: tenDaysAgo, // Needs Update!
    },
  })

  const sponsor5 = await prisma.sponsor.create({
    data: {
      sponsor_name: 'Tata Consultancy Services',
      linked_event_id: robotics.id,
      owner_id: sponsorLead1.id,
      expected_amount: 400000,
      probability_percentage: 70,
      stage: 'InDiscussion',
      notes: 'Meeting scheduled next week with CSR head.',
      last_updated_at: tenDaysAgo, // Needs Update!
    },
  })

  const sponsor6 = await prisma.sponsor.create({
    data: {
      sponsor_name: 'Flipkart',
      linked_event_id: startup.id,
      owner_id: sponsorLead2.id,
      expected_amount: 250000,
      probability_percentage: 55,
      stage: 'Negotiation',
      notes: 'Discussing title sponsor package.',
      last_updated_at: yesterday,
    },
  })

  const sponsor7 = await prisma.sponsor.create({
    data: {
      sponsor_name: 'NVIDIA',
      linked_event_id: robotics.id,
      owner_id: sponsorLead1.id,
      expected_amount: 350000,
      probability_percentage: 65,
      stage: 'Lead',
      notes: 'Found contact on LinkedIn. Yet to reach out formally.',
      last_updated_at: tenDaysAgo, // Needs Update!
    },
  })

  const sponsor8 = await prisma.sponsor.create({
    data: {
      sponsor_name: 'RedBull India',
      linked_event_id: gaming.id,
      owner_id: sponsorLead2.id,
      expected_amount: 180000,
      probability_percentage: 100,
      stage: 'ClosedWon',
      notes: 'Event completed. Amount received.',
      last_updated_at: yesterday,
    },
  })

  const sponsor9 = await prisma.sponsor.create({
    data: {
      sponsor_name: 'Infosys BPM',
      linked_event_id: hackathon.id,
      owner_id: sponsorLead2.id,
      expected_amount: 200000,
      probability_percentage: 20,
      stage: 'ClosedLost',
      notes: 'Budget constraints on their end. Should try next year.',
      last_updated_at: threeDaysAgo,
    },
  })

  console.log('✅ Sponsors created')

  // Weekly Updates
  await prisma.weeklyUpdate.createMany({
    data: [
      {
        sponsor_id: sponsor1.id,
        updated_by_user_id: sponsorLead1.id,
        update_summary: 'Had a 45-min call with Google partnership team. Very positive response. Moving to legal review.',
        blockers: 'Waiting for NDA to come from their legal team.',
        next_steps: 'Follow up with legal team on Friday. Share final branding package.',
        created_at: threeDaysAgo,
      },
      {
        sponsor_id: sponsor1.id,
        updated_by_user_id: sponsorLead1.id,
        update_summary: 'Initial email sent to Google India partnerships team. Got auto-reply, following up.',
        blockers: 'No direct contact found yet.',
        next_steps: 'Try LinkedIn outreach to marketing VP.',
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      },
      {
        sponsor_id: sponsor2.id,
        updated_by_user_id: sponsorLead1.id,
        update_summary: 'Had intro call. They want to sponsor with Azure credits + logo. Drafting proposal.',
        blockers: 'Need approval on revised branding pack.',
        next_steps: 'Share updated sponsorship deck with credits breakdown.',
        created_at: threeDaysAgo,
      },
      {
        sponsor_id: sponsor3.id,
        updated_by_user_id: sponsorLead2.id,
        update_summary: 'Contract finalized. Zomato stalls confirmed for both days.',
        blockers: '',
        next_steps: 'Coordinate logistics during event week.',
        created_at: yesterday,
      },
      {
        sponsor_id: sponsor6.id,
        updated_by_user_id: sponsorLead2.id,
        update_summary: 'Negotiating title sponsor benefits. They want speaker slots too.',
        blockers: 'Internal approval needed for speaker slot policy.',
        next_steps: 'Confirm with Fest Head about speaker slot availability.',
        created_at: yesterday,
      },
    ],
  })

  console.log('✅ Weekly updates created')

  // Deliverables
  const futureDate1 = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
  const futureDate2 = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
  const pastDate1 = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  const pastDate2 = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)

  await prisma.deliverable.createMany({
    data: [
      {
        sponsor_id: sponsor1.id,
        event_id: hackathon.id,
        title: 'Send Branding Kit to Google',
        description: 'Share high-res logos, banner dimensions, and stage layout to Google marketing team.',
        assigned_to_user_id: sponsorLead1.id,
        due_date: futureDate1,
        status: 'InProgress',
      },
      {
        sponsor_id: sponsor1.id,
        event_id: hackathon.id,
        title: 'Get Google Contract Signed',
        description: 'Finalize NDA and MoU with Google legal team before cutoff.',
        assigned_to_user_id: festHead.id,
        due_date: futureDate2,
        status: 'Pending',
      },
      {
        sponsor_id: sponsor2.id,
        event_id: hackathon.id,
        title: 'Prepare Azure Credits Package Doc',
        description: 'Document the exact Azure credits offering to share with Microsoft.',
        assigned_to_user_id: sponsorLead1.id,
        due_date: pastDate1,
        status: 'Pending', // Overdue!
      },
      {
        sponsor_id: sponsor3.id,
        event_id: culturalNight.id,
        title: 'Confirm Zomato Stall Locations',
        description: 'Share campus map and confirm stall positions with Zomato operations.',
        assigned_to_user_id: sponsorLead2.id,
        due_date: futureDate1,
        status: 'Completed',
      },
      {
        sponsor_id: sponsor6.id,
        event_id: startup.id,
        title: 'Flipkart Sponsorship Deck Update',
        description: 'Add speaker slot details to the deck. Include analytics from last year.',
        assigned_to_user_id: sponsorLead2.id,
        due_date: pastDate2,
        status: 'InProgress', // Overdue!
      },
      {
        event_id: hackathon.id,
        title: 'Hackathon Problem Statements Finalized',
        description: 'All tracks need problem statements confirmed by event team.',
        assigned_to_user_id: eventHead1.id,
        due_date: futureDate2,
        status: 'InProgress',
      },
      {
        event_id: culturalNight.id,
        title: 'Stage Design Approval',
        description: 'Get final stage design approved from Fest Head.',
        assigned_to_user_id: eventHead2.id,
        due_date: futureDate1,
        status: 'Pending',
      },
      {
        event_id: robotics.id,
        title: 'Equipment Booking for Robotics Arena',
        description: 'Book robot kits and arena components from tech store.',
        assigned_to_user_id: eventHead1.id,
        due_date: pastDate1,
        status: 'Pending', // Overdue!
      },
    ],
  })

  console.log('✅ Deliverables created')

  console.log('')
  console.log('🎉 Database seeded successfully!')
  console.log('')
  console.log('📋 Login Credentials:')
  console.log('┌─────────────────────────────────────────────────────┐')
  console.log('│ Role              │ Email                │ Password    │')
  console.log('├─────────────────────────────────────────────────────┤')
  console.log('│ Fest Head         │ arjun@techfest.edu   │ festhead123 │')
  console.log('│ Event Head        │ priya@techfest.edu   │ eventhead123│')
  console.log('│ Event Head        │ rohan@techfest.edu   │ rohan123    │')
  console.log('│ Sponsorship Lead  │ kavya@techfest.edu   │ sponsorlead123│')
  console.log('│ Sponsorship Lead  │ aditya@techfest.edu  │ aditya123   │')
  console.log('└─────────────────────────────────────────────────────┘')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
