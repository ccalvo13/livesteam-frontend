import Vue from 'vue';
import Vuetify from 'vuetify/lib/framework';
import '@mdi/font/css/materialdesignicons.css'

Vue.use(Vuetify);
const myCustomLightTheme = {
    dark: false,
    colors: {
      background: '#FFFFFF',
      surface: '#FFFFFF',
      primary: '#3F372E',
      'primary-darken-1': '#141414',
      secondary: '#03DAC6',
      'secondary-darken-1': '#018786',
      error: '#B00020',
      info: '#2196F3',
      success: '#4CAF50',
      warning: '#FB8C00',
    },
  }
export default new Vuetify({
    theme: {
        defaultTheme: 'myCustomLightTheme',
        themes: {
            myCustomLightTheme,
        },
    },
    defaults: {
        VBtn: {
          color: 'primary',
          variant: 'outlined',
          rounded: true,
        },
      },
    icons: {
        iconfont: 'mdi',
    },
});
