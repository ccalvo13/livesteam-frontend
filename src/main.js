import Vue from 'vue'
import App from './App.vue'
import WebRTC from 'vue-webrtc'
import Ads from 'vue-google-adsense'
import './index.css'
import vuetify from './plugins/vuetify'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'
import "@mdi/font/css/materialdesignicons.css";
Vue.use(require('vue-script2'))

Vue.use(Vuetify)
Vue.use(Ads.Adsense)
Vue.use(WebRTC)
Vue.config.productionTip = false

new Vue({
  vuetify,
  render: h => h(App)
}).$mount('#app')
