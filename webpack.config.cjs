const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  const config = {
    entry: './src/index.ts',
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist'),
      clean: true
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/i,
          loader: 'ts-loader',
          exclude: ['/node_modules/']
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
          type: 'asset'
        },
        {
          test: /\.md$/,
          type: 'asset/source'
        }
      ]
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js']
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: 'public/index.html',
        filename: 'index.html'
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'test',
            to: 'test',
            noErrorOnMissing: true
          }
        ]
      })
    ]
  };

  if (isProduction) {
    config.mode = 'production';
    config.devtool = 'source-map';
  } else {
    config.mode = 'development';
    config.devtool = 'inline-source-map';

    config.devServer = {
      open: true,
      host: 'localhost',
      port: 44300,
      server: {
        type: 'https'
      },
      hot: true,
      static: {
        directory: path.join(__dirname, 'dist')
      },
      client: {
        overlay: {
          errors: true,
          warnings: false
        },
        logging: 'info'
      },
      devMiddleware: {
        writeToDisk: false
      }
    };
  }

  return config;
};
