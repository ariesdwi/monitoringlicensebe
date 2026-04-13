import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const rawData = [
  "1\tCOP\t\tAditya Andrianto\tODP\tTHANOS\t337709\tAlfian Fadhil Labib\talfian.fadhil.labib@copr.bri.co.id\tAvailable\t\t",
  "2\tCOP\t\tAditya Andrianto\tODP\tTHANOS\t90185465\tMuhamad Dwi Arifianto\tmuh.dwi.arifianto@gmail.com\tAvailable\t\t",
  "3\tCOP\t\tAditya Andrianto\tODP\tTHANOS\t90183785\tDiaz Ramadhani Mahendra Djuanda\tdiazdjuanda@gmail.com\tAvailable\t\t",
  "4\tCOP\t\tAditya Andrianto\tODP\tTHANOS\t90184338\tIbrahim Syah Qardhawi\tibrahim.syah.q@gmail.com\tAvailable\t\t",
  "5\tCOP\t\tAditya Andrianto\tODP\tGROOT\t90183787\tHandaru Dwiki Yuntara\thandarudwiki04@gmail.com\tAvailable\t\t",
  "6\tCOP\t\tAditya Andrianto\tODP\tGROOT\t90173889\tMuhammad FIkri Najib\trifik91@gmail.com\tAvailable\t\t",
  "7\tCOP\t\tAditya Andrianto\tODP\tGROOT\t90181399\tMochamad Rizky Purnama\tmochamadrizkypurnama@gmail.com\tAvailable\t\t",
  "8\tCOP\t\tAditya Andrianto\tODP\tGROOT\t90185462\tThareq Kemal Habibie\tthareq.kemal24@gmail.com\tAvailable\t\t",
  "9\tCOP\t\tAditya Andrianto\tODP\tGROOT\t90172804\tAkbar Rahmana\takbar.rahmana@gmail.com\tAvailable\t\t",
  "10\tCOP\t\tAditya Andrianto\tODP\tGROOT\t90185467\tMuhammad Hamdani\thamdanimuhammad12@gmail.com\tAvailable\t\t",
  "11\tESP\t\tWondo\tLCP-MPD/MFP-KONSUMER\tMIKRO1\t310286\tWilliam Rahman (SAD)\t\tAvailable\t\t",
  "12\tESP\t\tWondo\tLCP-MPD/MFP-KONSUMER\tMIKRO1\t70000880\tAndika Erwansyah (BE)\t\tAvailable\t\t",
  "13\tESP\t\tWondo\tLCP-MPD/MFP-KONSUMER\tMIKRO1\t90163184\tSohibun Nawawi (Mobile)\t\tAvailable\t\t",
  "14\tESP\t\tWondo\tLCP-MPD/MFP-KONSUMER\tMIKRO1\t70002325\tLalu Ahdiyat (BE)\t\tAvailable\t\t",
  "15\tESP\t\tWondo\tLCP-MPD/MFP-KONSUMER\tMIKRO1\t70000875\tM. Fizar Alfath (Web)\t\tAvailable\t\t",
  "16\tESP\t\tWondo\tLCP-MPD/MFP-KONSUMER\tBRIGUNA-KONSUMER 2\t342938\tA. A. Gde Agung Aditya\t\tAvailable\t\t",
  "17\tESP\t\tWondo\tLCP-MPD/MFP-KONSUMER\tBRIGUNA-KONSUMER 2\t70000490\tPutu Mas Anggita Putra\t\tAvailable\t\t",
  "18\tESP\t\tWondo\tLCP-MPD/MFP-KONSUMER\tBRIGUNA-KONSUMER 2\t70000506\tAnggi Mitra Pernando\t\tAvailable\t\t",
  "19\tESP\t\tWondo\tLCP-MPD/MFP-KONSUMER\tKONSUMER 2\t70002701\tMuhamad Rafli Nur Ikhsan\t\tAvailable\t\t",
  "20\tESP\t\tWondo\tLCP-MPD/MFP-KONSUMER\tRESERVED ESP\tRESERVED ESP\tRESERVED ESP\tRESERVED ESP\tAvailable\t\t",
  "21\tDWP\t\tDicky Firmansyah\tQLP1\tVICTOR\t273410\tAgung Nurjaya Megantara\t\tAvailable\t\t",
  "22\tDWP\t\tDicky Firmansyah\tQLP1\tVICTOR\t332949\tEric Frandika\t\tAvailable\t\t",
  "23\tDWP\t\tDicky Firmansyah\tQLP1\tVICTOR\t90168787\tPascal Pribadi Akhmad Panatagama\t\tAvailable\t\t",
  "24\tDWP\t\tDicky Firmansyah\tQLP1\tVICTOR\t90181312\tGabriel Raymond Dimpudus\t\tAvailable\t\t",
  "25\tDWP\t\tDicky Firmansyah\tQLP1\tVICTOR\t90185662\tMuhammad Fahmi Rasyid\t\tAvailable\t\t",
  "26\tDWP\t\tDicky Firmansyah\tQLP1\tVICTOR\t90185929\tCalviano Nathanael\t\tAvailable\t\t",
  "27\tDWP\t\tDicky Firmansyah\tQLP1\tVICTOR\t90186020\tFendy Asnanda Yusuf\t\tAvailable\t\t",
  "28\tDWP\t\tDicky Firmansyah\tQLP1\tASH\t90168776\tMuhammad Irfan\t\tAvailable\t\t",
  "29\tDWP\t\tDicky Firmansyah\tQLP1\tASH\t310287\tNindya Savirahandayani\t\tAvailable\t\t",
  "30\tDWP\t\tDicky Firmansyah\tQLP1\tASH\t3216060307970025\tFajar Setiawan\t\tAvailable\t\t",
  "31\tDGR\t\tMuh I Yusrifa\tMBP\tKYOTO-NS\t332892\tAbdur Rachman Wahed\t\tAvailable\t\t",
  "32\tDGR\t\tMuh I Yusrifa\tMBP\tKYOTO-NS\t70000302\tFaisal Bahri\t\tAvailable\t\t",
  "33\tDGR\t\tMuh I Yusrifa\tMBP\tKYOTO-NS\t70000305\tMuhammad Alwan\t\tAvailable\t\t",
  "34\tDGR\t\tMuh I Yusrifa\tMBP\tKYOTO-NS\t70001384\tMochammad Arie Aldiansyah\t\tAvailable\t\t",
  "35\tDGR\t\tMuh I Yusrifa\tMBP\t\t310324\tErzy Pratama Fadryan\t\tAvailable\t\t",
  "36\tDGR\t\tMuh I Yusrifa\tMBP\tRESERVED MBP\tRESERVED MBP\tRESERVED MBP\tRESERVED MBP\tAvailable\t\t",
  "37\tDGR\t\tMuh I Yusrifa\tMBP\tRESERVED MBP\tRESERVED MBP\tRESERVED MBP\tRESERVED MBP\tAvailable\t\t",
  "38\tDGR\t\tMuh I Yusrifa\tMBP\tRESERVED MBP\tRESERVED MBP\tRESERVED MBP\tRESERVED MBP\tAvailable\t\t",
  "39\tDGR\t\tMuh I Yusrifa\tMBP\tRESERVED MBP\tRESERVED MBP\tRESERVED MBP\tRESERVED MBP\tAvailable\t\t",
  "40\tDGR\t\tMuh I Yusrifa\tMBP\tMBP\tRESERVED MBP\tRESERVED MBP\tRESERVED MBP\tAvailable\t\t",
  "41\tMDD\t\tFendy Gusta\tOAP\t\t351353\tDzulfiqar Ali A\t\tAvailable\t\t",
  "42\tMDD\t\tFendy Gusta\tOAP\t\t294562\tMohammad Syahrian Adil A B\t\tAvailable\t\t",
  "43\tMDD\t\tFendy Gusta\tOAP\t\t70002796\tMuchamad Coirul Anwar\t\tAvailable\t\t",
  "44\tMDD\t\tFendy Gusta\tOAP\tRESERVED OAP\t345886\tNina Aulia Saputro\tRESERVED OAP\tAvailable\t\t",
  "45\tMDD\t\tFendy Gusta\tOAP\tRESERVED OAP\tRESERVED OAP\tRESERVED OAP\tRESERVED OAP\tAvailable\t\t",
  "46\tMDD\t\tFendy Gusta\tOAP\tRESERVED OAP\t361926\tDimas Aditya Maulana Fajri\tdimas.aditya.maulana@corp.bri.co.id\tAvailable\t\t",
  "47\tMDD\t\tFendy Gusta\tOAP\tRESERVED OAP\t337849\tNerisa Arviana\tnerisa.arviana@brilian.bri.co.id\tAvailable\t\t",
  "48\tMDD\t\tFendy Gusta\tOAP\tRESERVED OAP\t00332986\tApriantoni\tapriantoni.332986@brilian.bri.co.id\tAvailable\t\t",
  "49\tMDD\t\tFendy Gusta\tOAP\tRESERVED OAP\t90185521\tMuhamad Ilham Putra\t90185521@brilian.bri.co.id\tAvailable\t\t",
  "50\tMDD\t\tFendy Gusta\tOAP\tRESERVED OAP\t90185468\tMuhammad Zada W\t90185468@brilian.bri.co.id\tAvailable\t\t"
];

async function main() {
  console.log('🚀 Menambahkan user data untuk lisensi COPILOT...');

  const date = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());
  
  const tlCache: Record<string, number> = {};
  
  for (const line of rawData) {
    if (!line.trim()) continue;
    const cols = line.split('\t');
    
    const departemen = (cols[1]?.trim()) || '-';
    let aplikasi = (cols[2]?.trim()) || '-';
    const tlName = cols[3]?.trim();
    const fungsi = (cols[4]?.trim()) || '-';
    const squad = (cols[5]?.trim()) || '-';
    const nik = (cols[6]?.trim()) || '';
    const nama = (cols[7]?.trim()) || '';
    let email = (cols[8]?.trim()) || '';
    const statusRaw = (cols[9]?.trim()) || '';

    if (!tlName) continue;

    // Format if nama or email missing
    if (!email && nama && !nama.includes("RESERVED")) {
      email = nama.toLowerCase().replace(/[^a-z0-9]/g, '.') + '@corp.bri.co.id';
    }
    
    // Cari Team ID
    let teamId = tlCache[tlName];
    if (!teamId) {
      let nameSuffix = fungsi !== '-' ? fungsi : tlName.split(' ')[0];
      let teamName = departemen + " " + nameSuffix;
      let team = await prisma.team.findFirst({ where: { name: teamName } });
      if (!team) {
        team = await prisma.team.create({
          data: {
            name: teamName,
            tlName: tlName,
            maxQuota: 20
          }
        });
        
        const emailTl = tlName.toLowerCase().replace(/\\s+/g, '.') + '@corp.id';
        const existingUser = await prisma.user.findUnique({ where: { email: emailTl } });
        if (!existingUser) {
          const password = await bcrypt.hash('bri@1234', 10);
          await prisma.user.create({
            data: {
              email: emailTl,
              password,
              name: tlName,
              role: 'TL',
              initials: tlName.split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase(),
              title: 'TL · ' + departemen,
              teamId: team.id
            }
          });
        }
      }
      teamId = team.id;
      tlCache[tlName] = teamId;
      
      // Upsert TeamApp
      try {
        await prisma.teamApp.create({
          data: { teamId, departemen, aplikasi: aplikasi === '-' ? 'Copilot AI' : aplikasi }
        });
      } catch (e) {
        // Ignore if already exists
      }
    }

    let isReserved = nama.includes('RESERVED') || email.includes('RESERVED') || nama === '';
    let status = isReserved ? 'AVAILABLE' : 'DONE';
    
    let displayName = nama;
    if (nik && !isReserved) {
      displayName = nik + " - " + nama;
    }

    await prisma.license.create({
      data: {
        userName: isReserved ? 'RESERVED SLOT' : displayName,
        email: isReserved ? (email || 'reserved@corp.id') : email,
        userType: 'Internal',
        departemen,
        aplikasi: aplikasi === '-' ? 'Copilot AI' : aplikasi,
        squad,
        tlName,
        teamId,
        aiTool: 'Copilot',
        status,
        date
      }
    });

    console.log("✅ Added Copilot License for " + (isReserved ? 'RESERVED' : nama) + " (Team: " + tlName + ")");
  }

  console.log('\\n🎉 Selesai menambahkan 50 lisensi Copilot!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
