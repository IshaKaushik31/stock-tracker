const bcrypt=require('bcrypt');
async function test(){
  const password="343@^123isha";
  const hash= await bcrypt.hash(password,10);
  const isSame= await bcrypt.compare('isha',hash);
  console.log({
    password,
    hash,
    isSame
  });
}
test();

