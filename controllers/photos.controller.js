const Photo = require('../models/Photo.model');
const Voter = require('../models/Voter.model')

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if (title && author && email && file) { // if fields are not empty...

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split('.').slice(-1)[0];

      if (fileExt === 'jpg' || fileExt === 'gif' || fileExt === 'png') {

        if ((title.length <= 25) && (author.length <= 50)) {

          const pattern = new RegExp(/([A-z\s.,]*)/, 'g');
          const emailPattern = new RegExp('^[a-zA-Z0-9_.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,3}');

          const emailMatched = email.match(emailPattern);
          const titleMatched = title.match(pattern).join('');
          const authorMatched = author.match(pattern).join('');

          if (titleMatched.length < title.length || authorMatched.length < author.length || emailMatched === null) {
            throw new Error('Invalid characters...');
          }

          const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
          await newPhoto.save(); // ...save new photo in DB
          res.json(newPhoto);
        } else {
          throw new Error('author or title is too long');
        }
      } else {
        throw new Error('Wrong format');
      }
    }
    else {
      throw new Error('Wrong input!');
    }
  } catch (err) {
    res.status(500).json(err);
  }

};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch (err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {
  const ip = req.ip
  const id = req.params.id
  try {
    const result = await Voter.findOneAndUpdate(
      { user: ip },
      { $setOnInsert: { user: ip }},
      { new: true, upsert: true }
    );
    if (result.votes.includes(id)) {
      console.log('the vote has already been cast')
      throw new Error('the vote has already been cast')
    } else {
      result.votes.push(id);
      await result.save();
      const photoToUpdate = await Photo.findOne({ _id: req.params.id });
      if (!photoToUpdate) res.status(404).json({ message: 'Not found' });
      else {
        photoToUpdate.votes++;
        photoToUpdate.save();
        res.send({ message: 'OK' });
      }
    }
  } catch (err) {
    res.status(500).json(err);
  }

};
