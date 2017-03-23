var ref;
const HOT = ((ref = module.parent.filename) != null ? ref.indexOf('hot.webpack.js') : void 0) !== -1;
console.log('Webpack HOT : ', HOT, '\n');

var webpack = require('webpack');
var path = require('path');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var HardSourceWebpackPlugin = require('hard-source-webpack-plugin');

var plugins = [];

var production = false;

if (production) {
	plugins.push(
		new webpack.optimize.UglifyJsPlugin({
			compress: {
				warnings: false
			}
		})
	)
}
if (!production) {
	plugins.unshift(new(require('hard-source-webpack-plugin'))({
		cacheDirectory: path.resolve(__dirname, './tmp/hard-plugin/[confighash]')
		, recordsPath: path.resolve(__dirname, './tmp/hard-plugin/[confighash]/records.json')
		, configHash: function(webpackConfig) {
			return require('node-object-hash')().hash(webpackConfig);
		}
		, environmentHash: {
			root: process.cwd()
			, directories: ['node_modules']
			, files: ['package.json']
		}
	}))
}
if (HOT) {
	plugins.push(new webpack.HotModuleReplacementPlugin())
}

plugins.push(
	new ExtractTextPlugin({
		filename: path.join('..', 'css', 'theme.css')
		, allChunks: true
		, disable: HOT // if hot enabled disable ExtractTextPlugin
	})
);
if (production && !HOT) {
	plugins.unshift({
		apply: (compiler) => { // min plugin clear folder
			let rimraf = require(`rimraf`);
			[`/`, `/../css`].forEach((subPath) => {
				rimraf.sync(path.resolve(compiler.options.output.path + subPath));
			});
		}
	});
}


let addHOT = (arr, disable) => {
	if (HOT) {
		arr.unshift('webpack/hot/dev-server', 'webpack-hot-middleware/client');
	}
	return arr;
};


module.exports = {
	entry: {
		theme: addHOT(['./js/theme.js'])
	}
	, output: {
		path: path.resolve(__dirname + '/../assets/js')
		, filename: 'theme.js'
	}
	, module: {
		rules: [{
			test: /\.js$/
			, use: {
				loader: 'babel-loader'
				, options: {
					presets: ['env']
					, plugins: ["syntax-dynamic-import"]
				}
			}
		}, {
			test: /\.scss$/
			, loader: ExtractTextPlugin.extract({
				fallback: 'style-loader'
				, use: [{
					loader: `css-loader`
					, options: {
						sourceMap: true
						, importLoaders: 2
					}
				}, {
					loader: 'postcss-loader'
				}, {
					loader: `sass-loader`
					, options: {
						sourceMap: true
					}
				}]
			})
		}, {
			test: /.(jpg|png|woff(2)?|eot|ttf|svg)(\?[a-z0-9=\.]+)?$/
			, loader: 'file-loader?name=../css/[hash].[ext]'
		}, {
			test: /\.css$/
			, loader: ExtractTextPlugin.extract({
				fallback: 'style-loader'
				, use: [{
					loader: `css-loader`
					, options: {
						sourceMap: true
						, importLoaders: 1
					}
				}, {
					loader: 'postcss-loader'
				}]
			})
		}]
	}
	, externals: {
		prestashop: 'prestashop'
		, $: '$'
		, jquery: 'jQuery'
	}
	, devtool: HOT ? 'cheap-module-inline-source-map' : 'source-map'
	, plugins: plugins
	, resolve: {
		extensions: ['.js', '.scss']
	}
};