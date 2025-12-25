import fs from 'fs';
try {
  const buffer = fs.readFileSync('.env');
  console.log(buffer.toString('hex'));
} catch (e) {
  console.error(e);
}
