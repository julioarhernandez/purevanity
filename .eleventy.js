const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const embedJson = require("embed-json");
const sitemap = require("@quasibit/eleventy-plugin-sitemap");
const htmlmin = require("html-minifier");
const pluginSEO = require("eleventy-plugin-seo");
const Image = require("@11ty/eleventy-img");
const { DateTime } = require("luxon");

module.exports = function (eleventyConfig) {
  // eleventyConfig.addNunjucksAsyncShortcode("myImage", async function(src, alt, className, width=[350], outputFormat = "jpeg") {
  //     if(alt === undefined) {
  //       // You bet we throw an error on missing alt (alt="" works okay)
  //       throw new Error(`Missing \`alt\` on myImage from: ${src}`);
  //     }
  //     var source = `./src${src}`;
  //     // returns Promise
  //     let stats = await Image(source, {
  //       formats: [outputFormat],
  //       // This uses the original image width
  //       widths: width,
  //       urlPath: "/assets/img/",
  //       outputDir: "_site/assets/img/",
  //     });

  //     let prop = stats[outputFormat].pop();

  //     return `<img src="${prop.url}" width="${prop.width}" height="${prop.height}" alt="${alt}" class="${className}"/>`;
  //   });
  // eleventyConfig.addShortcode("myImage", async function(src, alt, sizes) {
  // 	let metadata = await Image(src, {
  // 		widths: [300, 600],
  // 		formats: ["jpg", "jpeg"],
  //         urlPath: "/img/",
  //         outputDir: "./src/img/",
  // 	});

  // 	let imageAttributes = {
  // 		alt,
  // 		sizes,
  // 		loading: "lazy",
  // 		decoding: "async",
  // 	};

  // 	// You bet we throw an error on a missing alt (alt="" works okay)
  // 	return Image.generateHTML(metadata, imageAttributes);
  // });
  eleventyConfig.addPlugin(eleventyNavigationPlugin);
  eleventyConfig.addPlugin(pluginSEO, require("./src/_data/seo.json"));
  eleventyConfig.addPlugin(sitemap, {
    sitemap: {
      lastModifiedProperty: "modified",
      hostname: "https://www.bizmarketing.us",
    },
  });
  // https://www.11ty.dev/docs/data-deep-merge/
  eleventyConfig.setDataDeepMerge(true);

  eleventyConfig.addTransform("embedjson", function (content, outputPath) {
    if (outputPath.endsWith(".html")) {
      let contentEmbedded = embedJson(content);
      return contentEmbedded;
    }
    return content;
  });
  eleventyConfig.addTransform("htmlmin", function (content, outputPath) {
    if (process.env.ELEVENTY_PRODUCTION && outputPath.endsWith(".html")) {
      let minified = htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
        minifyJS: true,
      });
      return minified;
    }

    return content;
  });
  // eleventyConfig.addWatchTarget("./src/assets/scss/");
  eleventyConfig
    .addPassthroughCopy("./src/assets/*")
    .addPassthroughCopy("./src/robots.txt")
    .addPassthroughCopy("./src/favicon*")
    .addPassthroughCopy("./src/admin");
  eleventyConfig.addLayoutAlias("postsEn", "layouts/postsEn.njk");
  eleventyConfig.addLayoutAlias("postsEs", "layouts/postsEs.njk");
  eleventyConfig.addFilter("dump", (obj) => {
    const getCircularReplacer = () => {
      const seen = new WeakSet();
      return (key, value) => {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
            return;
          }
          seen.add(value);
        }
        return value;
      };
    };

    return JSON.stringify(obj, getCircularReplacer(), 4);
  });
  eleventyConfig.addFilter("times", function (value, multiplier) {
    return value * multiplier;
  });
  // eleventyConfig.addFilter("filterTagList", tags => {
  //     // should match the list in tags.njk
  //     return (tags || []).filter(tag => ["post","articulos", "posts", "tagList", "all"].indexOf(tag) === -1);
  // });
  // eleventyConfig.addFilter("cssmin", function(code) {
  //     return new cleanCss({}).minify(code).styles;
  // });
  // eleventyConfig.addFilter("readableDate", dateObj => {
  //     return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat("LLLL dd,  yyyy");
  // });
  // https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
  // eleventyConfig.addFilter('htmlDateString', (dateObj) => {
  //     return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat('yyyy-LL-dd');
  // });
  eleventyConfig.addFilter("bust", (url) => {
    if (process.env.ELEVENTY_ENV === "development") {
      // In development mode, just return the original URL without cache busting
      return url;
    }

    const [urlPart, paramPart] = url.split("?");
    const params = new URLSearchParams(paramPart || "");
    params.set("v", DateTime.local().toFormat("X"));
    return `${urlPart}?${params}`;
  });

  eleventyConfig.addCollection("services", function () {
    // Load the JSON data
    const servicesData = require("./src/_data/services.json");

    // Flatten the service categories and their services into individual service objects
    const services = [];
    servicesData.serviceCategories.forEach((category) => {
      category.services.forEach((service) => {
        services.push({
          category: category.title,
          title: service.title,
          slug: service.title.toLowerCase().replace(/\s+/g, "-"),
          smallDescription: service.smallDescription,
          longDescription: service.longDescription,
          icon: service.icon,
          image: service.image,
        });
      });
    });

    return services;
  });

  // eleventyConfig.addFilter('setAttribute', function (dictionary, key, value, append = true) {
  //     const newValue = append ? (dictionary[key] + ' ' + value) : value;
  //     dictionary[key] = newValue;
  //     return dictionary;
  // });

  // Create an array of all tags
  // eleventyConfig.addCollection("tagList", function (collection) {
  //     let tagSet = new Set();
  //     collection.getAll().forEach(item => {
  //         (item.data.tags || []).forEach(tag => tagSet.add(tag));
  //     });

  //     return [...tagSet];
  // });

  return {
    passthroughFileCopy: true,
    markdownTemplateEngine: "njk",
    templateFormats: [
      "md",
      "njk",
      "eot",
      "ttf",
      "woff",
      "woff2",
      "svg",
      "jpg",
      "png",
      "css",
      "svg",
      "yml",
      "gif",
      "txt",
      "js",
    ],
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
    },
  };
};
