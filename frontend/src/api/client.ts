import axios, { InternalAxiosRequestConfig } from 'axios'

const client = axios.create({
  baseURL: '/api',
})

// Add token from localStorage to all requests
client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('crm_token')
  if (token) {
    config.headers.Authorization = `Token ${token}`
  }
  return config
})

export default client
