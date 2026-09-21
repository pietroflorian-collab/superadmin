// set-admin.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// El JSON está en la MISMA carpeta que este script
const serviceAccount = require('./service-account.json');

// Inicializar la app admin
const app = initializeApp({
  credential: cert(serviceAccount)
});

// Tu UID de admin
const UID = 'hb8ziusuzMeVYflWjsXn43VkcuT2';

(async () => {
  try {
    // 1. Asignar el custom claim
    await getAuth(app).setCustomUserClaims(UID, { admin: true });
    console.log('✅ Claim "admin: true" asignado al UID', UID);

    // 2. Verificar que quedó bien
    const user = await getAuth(app).getUser(UID);
    console.log('📋 Claims actuales:', user.customClaims);

    console.log('\n⚠️ IMPORTANTE: el usuario debe cerrar sesión y volver a entrar,');
    console.log('   porque el claim se inyecta en el token al hacer login.');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
})();