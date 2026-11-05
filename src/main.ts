import { createApp } from 'vue';
import App from './App.vue';
import './style.css';

const app = createApp(App);

// Global error handler
// app.config.errorHandler = (err, instance, info) => {
  // console.error('Vue error:', err, info);
  // Could add global error reporting here
// };

// Performance monitoring
// if (import.meta.env.PROD) {
//   app.config.performance = true;
// }

app.mount('#app');