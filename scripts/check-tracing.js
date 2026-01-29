/**
 * Script de diagnostic pour vérifier le tracing
 */

const http = require('http');

console.log('🔍 Diagnostic du Tracing OpenTelemetry\n');

// 1. Vérifier que l'application répond
console.log('1. Vérification de l\'application...');
http.get('http://localhost:3001/api/health', (res) => {
  console.log(`   ✅ Application répond (status: ${res.statusCode})`);
  
  // 2. Vérifier Alloy
  console.log('\n2. Vérification d\'Alloy...');
  http.get('http://localhost:12345/api/v0/web/components', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const components = JSON.parse(data);
        const otlpReceiver = components.find(c => c.name === 'otelcol.receiver.otlp.default');
        if (otlpReceiver) {
          console.log('   ✅ Alloy OTLP receiver trouvé');
          console.log(`   📊 Health: ${otlpReceiver.health?.status || 'unknown'}`);
        } else {
          console.log('   ⚠️  Alloy OTLP receiver non trouvé');
        }
      } catch (e) {
        console.log('   ⚠️  Impossible de parser la réponse Alloy');
      }
      
      // 3. Vérifier Jaeger
      console.log('\n3. Vérification de Jaeger...');
      http.get('http://localhost:16686/api/services', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const services = JSON.parse(data);
            console.log(`   ✅ Jaeger répond`);
            console.log(`   📊 Services trouvés: ${services.data?.join(', ') || 'aucun'}`);
            if (services.data?.includes('devsecops-api')) {
              console.log('   ✅ Service devsecops-api présent dans Jaeger');
            } else {
              console.log('   ⚠️  Service devsecops-api NON présent dans Jaeger');
            }
          } catch (e) {
            console.log('   ⚠️  Jaeger ne répond pas ou erreur de parsing');
          }
          
          console.log('\n📝 Instructions:');
          console.log('1. Vérifiez que l\'application tourne avec: npm run dev');
          console.log('2. Vérifiez les logs de l\'app pour "[Tracing] OpenTelemetry SDK initialized"');
          console.log('3. Faites une requête POST: curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"username":"admin","password":"admin123"}\'');
          console.log('4. Vérifiez les logs Alloy: docker logs alloy | grep -i trace');
          console.log('5. Vérifiez les logs Jaeger: docker logs jaeger | tail -20');
          console.log('6. Dans Jaeger UI (http://localhost:16686), cherchez le service "devsecops-api"');
        });
      }).on('error', () => {
        console.log('   ❌ Jaeger ne répond pas (vérifiez docker-compose ps)');
      });
    });
  }).on('error', () => {
    console.log('   ❌ Alloy ne répond pas (vérifiez docker-compose ps)');
  });
}).on('error', () => {
  console.log('   ❌ Application ne répond pas sur http://localhost:3001');
  console.log('   💡 Assurez-vous que l\'application tourne avec: npm run dev');
});
