module.exports = {
  apps : [{
  name: 'Assignment_6',
  script: 'assignment6.js',
  instances: 1,
  autorestart: true,
  max_memory_restart: '1G',
  watch: false,
  env: {
    PORT: 3100,
    MONGO_CONN_STRING: 'mongodb://localhost:27017/',
    MONGO_DB_NAME: 'assignment6',
    MONGO_COLL_NAME: 'User',
    REDIS_ADDRESS: '127.0.0.1',
    REDIS_PORT: '6379',
    REDIS_EXPIRE: 10,
    GAME_PORT: 4200,
    SHARED_SECRET: "CS261S21"
  }
}],
};
