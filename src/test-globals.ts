(window as any).process = {
  env: {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_ANON_KEY: 'test-anon-key',
  },
};

Object.defineProperty(navigator, 'locks', {
  value: {
    request: (...args: unknown[]) => {
      const callback = args[args.length - 1];
      if (typeof callback === 'function') {
        return callback({ name: String(args[0]), mode: 'exclusive' });
      }
      return Promise.resolve();
    },
  },
  configurable: true,
});
