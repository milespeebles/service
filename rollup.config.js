import babel from 'rollup-plugin-babel'

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/server/bundle.js',
      format: 'cjs',
    }
  ],
  plugins: [
    babel (),
  ],
};
