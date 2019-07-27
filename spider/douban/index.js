const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');

const getTopMoive = () => {
  const url = 'https://movie.douban.com/top250';
  getMoivesFromUrl(url);
}

const getMoivesFromUrl = (url) => {
  request(url, function (err, res, body) {
    if (res.statusCode === 200) {
      const $ = cheerio.load(body);
      const movieItems = Array.from($('#wrapper .grid_view .item'));
      let movies = [];
      movieItems.forEach((movieItem) => {
        let movieItemHtml = $(movieItem).html();
        movies.push(getMoiveFromHtml(movieItemHtml))
      })
      saveMovie(movies);
    }
  })
}

const getMoiveFromHtml = (movieItem) => {
  const $ = cheerio.load(movieItem);
  let movie = {
    name: $('.title').text(),
    score: $('.rating_num').text(),
    quote: $('.inq').text(),
    rank: $('.pic em').text()
  }
  return movie
}

const saveMovie = (movies) => {
  const fileName = 'douban_top250.txt';
  const fileData = JSON.stringify(movies, null, '\t');
  fs.writeFile(fileName, fileData, 'utf8', (err) => {
    if (err) {
      console.log('保存文件出错', err);
      return;
    }
    console.log('保存文件成功');
  })
}

getTopMoive();
