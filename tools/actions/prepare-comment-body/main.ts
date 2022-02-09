import * as core from '@actions/core';

// TODO: REWORK
const main = async (): Promise<void> => {
  const images = core.getInput('images');
  const imgArr = JSON.parse(images);

  let str = '';
  if (imgArr.length) {
    imgArr.forEach((image) => {
      str += '![](' + image + ') \n';
    });
  }
  core.setOutput('body', str);
};

main().catch((err) => core.setFailed(err));
