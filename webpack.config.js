const path = require('path'),
    HtmlWebpackPlugin = require('html-webpack-plugin'),
    CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    entry: {
        app: './src/index.tsx',
        vendor: ['react', 'react-dom']
    },
    mode: "development",
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'js/[name].bundle.js'
    },
    resolve: {
        extensions: ['.js', '.jsx', '.json', '.ts', '.tsx', '.css'],
        fallback: {
            "fs": false,
            "tls": false,
            "net": false,
            "path": false,
            "zlib": false,
            "http": false,
            "https": false,
            "stream": false,
            "crypto": false,
            "crypto-browserify": false,
            "url": require.resolve("url/"),
            "buffer": require.resolve("buffer/"),
            "async_hooks": false
        }
    },
    optimization: {
        runtimeChunk: 'single'
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                loader: 'ts-loader',
                options: { allowTsInNodeModules: true }
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader', 'postcss-loader'],
            },
            {
                test: /\.(png|jpe?g|gif)$/i,
                use: [
                  {
                    loader: 'file-loader'
                  },
                ],
              }
        ]
    },
    devServer:
    {
        static: "./dist",
        hot: true,
        historyApiFallback: true
    },
    plugins: [
        new HtmlWebpackPlugin({ template: path.resolve(__dirname, 'public', 'index.html') }),
        new CopyPlugin({
            patterns: [
              {
                from: 'public/media', // src location
                to: 'images',       // destination location in dist folder
              },
            ],
            options: {
              concurrency: 100,
            },
          }),
    ]
}