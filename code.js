const { VK, Keyboard, Upload, Updates, API } = require("vk-io");
const { HearManager } = require("@vk-io/hear");
const mongoose = require("mongoose");
const config = require("./config.json");
const { SessionManager } = require("@vk-io/session");


const vk = new VK({
  token: config.token,
  apiVersion: "5.154",
});

const command = new HearManager();
const sessionManager = new SessionManager();
vk.updates.on("message", sessionManager.middleware);
vk.updates.on("message", command.middleware);

// -------------------------------------- MONGO -------------------------------------------------
mongoose.connect("connection link", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  user: "username",
  pass: "password",
  dbName: "database name",
});

const userSchema = new mongoose.Schema({
  vkUserId: Number,
  userNumber: Number,
  team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
});

const teamSchema = new mongoose.Schema({
	teamNumber: Number,
	position: { type: Number, default: 0 },
	score: { type: Number, default: 0 }, 
	members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  });
  
const adminSchema = new mongoose.Schema({
  vkUserId: Number,
  station: Number,
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "Admin" }],
});

const routeSchema = new mongoose.Schema({
  teamNumber: Number,
  route: String,
});

const stateSchema = new mongoose.Schema({
  station: Number,
  team1: Number,
  team2: Number,
  team3: Number,
  team4: Number,
  team5: Number,
  team6: Number,
  team7: Number,
  team8: Number,
  team9: Number,
  team10: Number,
  team11: Number,
});

const User = mongoose.model("User", userSchema);
const Team = mongoose.model("Team", teamSchema);
const Admin = mongoose.model("Admin", adminSchema);
const State = mongoose.model("State", stateSchema);
const Route = mongoose.model("Route", routeSchema);
// -------------------------------------- MONGO -------------------------------------------------

// -------------------------------------- ОБЩИЕ ВЕЩИ (ПЕРЕМЕННЫЕ, ФУНКЦИИ И Т.П.) -------------------------------------------------
let currentUserNumber = 0; // счетчик для лотереи
let lastAssignedTeamNumber = 0;


// для фото
const api = new API({
  token: config.token,
});
const upload = new Upload({
  api: api,
});

//функция для создания клавиатур
function createButton(label, command) {
  return {
    action: {
      type: "text",
      label,
      payload: JSON.stringify({ command }),
    },
    color: "primary",
  };
}

let oldPositionValue;
let newPositionValue;
let team;
let number;
let teamNumber;
// -------------------------------------- ОБЩИЕ ВЕЩИ (ПЕРЕМЕННЫЕ, ФУНКЦИИ И Т.П.) -------------------------------------------------

//----------------------------------- Start -------------------------------------------------
vk.updates.on('message_new', async (context) => {
	const { messagePayload } = context;
	if (context.isOutbox) {
		return; // игнорируем сообщения от бота
	  }
	

  const vkUserId = context.senderId;

  //----------------------------------- АДМИНКА -------------------------------------------------

  let userAdmin = await Admin.findOne({ vkUserId });
  
	if (userAdmin) {
		const adminProfile = await vk.api.users.get({
			user_ids: vkUserId.toString(),
			fields: "first_name", 
		  });

	const keyboardAdmin = {
		one_time: false,
		buttons: [
		  [
			{
			  action: {
				type: 'text',
				payload: {command: 'fiksiki'},
				label: 'Ко мне пришла команда',
			  },
			  color: 'primary',
			},
		  ],
		],
	  };

	  const keyboardTeams = {
		one_time: false,
		buttons: [
		  [
			{
			  action: {
				type: 'text',
				payload: { command: 'one' },
				label: '1',
			  },
			  color: 'primary',
			},
			{
			  action: {
				type: 'text',
				payload: { command: 'two' },
				label: '2',
			  },
			  color: 'primary',
			},
			{
			  action: {
				type: 'text',
				payload: { command: 'three' },
				label: '3',
			  },
			  color: 'primary',
			},
			{
			  action: {
				type: 'text',
				payload: { command: 'four' },
				label: '4',
			  },
			  color: 'primary',
			},
		  ],
		  [
			{
			  action: {
				type: 'text',
				payload: { command: 'five' },
				label: '5',
			  },
			  color: 'primary',
			},
			{
			  action: {
				type: 'text',
				payload: { command: 'six' },
				label: '6',
			  },
			  color: 'primary',
			},
			{
			  action: {
				type: 'text',
				payload: { command: 'seven' },
				label: '7',
			  },
			  color: 'primary',
			},
			{
			  action: {
				type: 'text',
				payload: { command: 'eight' },
				label: '8',
			  },
			  color: 'primary',
			},
		  ],
		  [
			{
			  action: {
				type: 'text',
				payload: { command: 'nine' },
				label: '9',
			  },
			  color: 'primary',
			},
			{
			  action: {
				type: 'text',
				payload: { command: 'ten' },
				label: '10',
			  },
			  color: 'primary',
			},
			{
			  action: {
				type: 'text',
				payload: { command: 'eleven' },
				label: '11',
			  },
			  color: 'primary',
			},
		  ],
		],
	  };
	  
	  const keyboardScore = {
		one_time: false,
		buttons: [
			[
				{
					action: {
						type: 'text',
						payload: { command: 'one point' },
						label: '1 балл',
					},
					color: 'primary',
				},
				{
					action: {
						type: 'text',
						payload: { command: 'two points' },
						label: '2 балла',
					},
					color: 'primary',
				},
				{
					action: {
						type: 'text',
						payload: { command: 'three points' },
						label: '3 балла',
					},
					color: 'primary',
				},
			],
			[
				{
					action: {
						type: 'text',
						payload: { command: 'four points' },
						label: '4 балла',
					},
					color: 'primary',
				},
				{
					action: {
						type: 'text',
						payload: { command: 'five points' },
						label: '5 баллов',
					},
					color: 'primary',
				},
				{
					action: {
						type: 'text',
						payload: { command: 'backspace' },
						label: 'Назад',
					},
					color: 'negative',
				},
			],
		],
	};
	

	  await context.send({
		keyboard: JSON.stringify(keyboardAdmin),
		message: `Привет, ${adminProfile[0].first_name}`,
	  });

	command.hear('Ко мне пришла команда', async (context) => {
		const vkUserId = context.senderId;
		if (context.messagePayload.command === 'fiksiki') {
			await context.send({
				keyboard: JSON.stringify(keyboardTeams),
				message: `Номер этой команды?`,
			  });
		}
	})

	command.hear('Назад', async (context) => {
		const vkUserId = context.senderId;
		if (context.messagePayload.command === 'backspace') {
			await context.send({
				keyboard: JSON.stringify(keyboardTeams),
				message: `Окей, выбери другую команду`,
			});
	
			try {
				const team = await Team.findOne({ teamNumber: teamNumber });
				
				if (team) {
					if (oldPositionValue !== NaN && oldPositionValue !== undefined) {
						team.position = oldPositionValue;
						await team.save(); 
					}
				}
			} catch (err) {
				console.error(err);
			}
	
			teamNumber = 0;
		}
	});
	

	command.hear('1', async (context) => {
		const vkUserId = context.senderId;
		if (context.messagePayload.command === 'one') { 
		  teamNumber = 1;
		  context.session.teamNumber = 1;
		  try {
			const team = await Team.findOne({ teamNumber: teamNumber }).exec();
			if (team) {
			  oldPositionValue = team.position;
			}
	  
			const admin = await Admin.findOne({ vkUserId: vkUserId }).exec();
			if (admin) {
			  newPositionValue = admin.station;
			}
	  
			const updatedTeam = await Team.findOneAndUpdate(
			  { teamNumber: teamNumber },
			  { $set: { position: newPositionValue } },
			  { new: true }
			).exec();
	  
			await context.send({
			  keyboard: JSON.stringify(keyboardScore),
			  message: 'Какое количество баллов начислить?',
			});
		  } catch (err) {
			console.error(err);
		  }
		}
	  });
	  
	command.hear('2', async (context) => {
		const vkUserId = context.senderId;
		if (context.messagePayload.command === 'two') { 
		  teamNumber = 2;
		  context.session.teamNumber = 2;
		  try {
			const team = await Team.findOne({ teamNumber: teamNumber }).exec();
			if (team) {
			  oldPositionValue = team.position;
			}
	  
			const admin = await Admin.findOne({ vkUserId: vkUserId }).exec();
			if (admin) {
			  newPositionValue = admin.station;
			}
	  
			const updatedTeam = await Team.findOneAndUpdate(
			  { teamNumber: teamNumber },
			  { $set: { position: newPositionValue } },
			  { new: true }
			).exec();
	  
			await context.send({
			  keyboard: JSON.stringify(keyboardScore),
			  message: 'Какое количество баллов начислить?',
			});
		  } catch (err) {
			console.error(err);
		  }
		}
	  });

	command.hear('3', async (context) => {
		const vkUserId = context.senderId;
		if (context.messagePayload.command === 'three') { 
		  teamNumber = 3;
		  context.session.teamNumber = 3;
		  try {
			const team = await Team.findOne({ teamNumber: teamNumber }).exec();
			if (team) {
			  oldPositionValue = team.position;
			}
	  
			const admin = await Admin.findOne({ vkUserId: vkUserId }).exec();
			if (admin) {
			  newPositionValue = admin.station;
			}
	  
			const updatedTeam = await Team.findOneAndUpdate(
			  { teamNumber: teamNumber },
			  { $set: { position: newPositionValue } },
			  { new: true }
			).exec();
	  
			await context.send({
			  keyboard: JSON.stringify(keyboardScore),
			  message: 'Какое количество баллов начислить?',
			});
		  } catch (err) {
			console.error(err);
		  }
		}
	  });

	command.hear('4', async (context) => {
		const vkUserId = context.senderId;
		if (context.messagePayload.command === 'four') { 
		  teamNumber = 4;
		  context.session.teamNumber = 4;
		  try {
			const team = await Team.findOne({ teamNumber: teamNumber }).exec();
			if (team) {
			  oldPositionValue = team.position;
			}
	  
			const admin = await Admin.findOne({ vkUserId: vkUserId }).exec();
			if (admin) {
			  newPositionValue = admin.station;
			}
	  
			const updatedTeam = await Team.findOneAndUpdate(
			  { teamNumber: teamNumber },
			  { $set: { position: newPositionValue } },
			  { new: true }
			).exec();
	  
			await context.send({
			  keyboard: JSON.stringify(keyboardScore),
			  message: 'Какое количество баллов начислить?',
			});
		  } catch (err) {
			console.error(err);
		  }
		}
	  });

	command.hear('5', async (context) => {
		const vkUserId = context.senderId;
		if (context.messagePayload.command === 'five') { 
		  teamNumber = 5;
		  context.session.teamNumber = 5;
		  try {
			const team = await Team.findOne({ teamNumber: teamNumber }).exec();
			if (team) {
			  oldPositionValue = team.position;
			}
	  
			const admin = await Admin.findOne({ vkUserId: vkUserId }).exec();
			if (admin) {
			  newPositionValue = admin.station;
			}
	  
			const updatedTeam = await Team.findOneAndUpdate(
			  { teamNumber: teamNumber },
			  { $set: { position: newPositionValue } },
			  { new: true }
			).exec();
	  
			await context.send({
			  keyboard: JSON.stringify(keyboardScore),
			  message: 'Какое количество баллов начислить?',
			});
		  } catch (err) {
			console.error(err);
		  }
		}
	  });

	command.hear('6', async (context) => {
		const vkUserId = context.senderId;
		if (context.messagePayload.command === 'six') { 
		  teamNumber = 6;
		  context.session.teamNumber = 6;
		  try {
			const team = await Team.findOne({ teamNumber: teamNumber }).exec();
			if (team) {
			  oldPositionValue = team.position;
			}
	  
			const admin = await Admin.findOne({ vkUserId: vkUserId }).exec();
			if (admin) {
			  newPositionValue = admin.station;
			}
	  
			const updatedTeam = await Team.findOneAndUpdate(
			  { teamNumber: teamNumber },
			  { $set: { position: newPositionValue } },
			  { new: true }
			).exec();
	  
			await context.send({
			  keyboard: JSON.stringify(keyboardScore),
			  message: 'Какое количество баллов начислить?',
			});
		  } catch (err) {
			console.error(err);
		  }
		}
	  });

	command.hear('7', async (context) => {
		const vkUserId = context.senderId;
		if (context.messagePayload.command === 'seven') { 
		  teamNumber = 7;
		  context.session.teamNumber = 7;
		  try {
			const team = await Team.findOne({ teamNumber: teamNumber }).exec();
			if (team) {
			  oldPositionValue = team.position;
			}
	  
			const admin = await Admin.findOne({ vkUserId: vkUserId }).exec();
			if (admin) {
			  newPositionValue = admin.station;
			}
	  
			const updatedTeam = await Team.findOneAndUpdate(
			  { teamNumber: teamNumber },
			  { $set: { position: newPositionValue } },
			  { new: true }
			).exec();
	  
			await context.send({
			  keyboard: JSON.stringify(keyboardScore),
			  message: 'Какое количество баллов начислить?',
			});
		  } catch (err) {
			console.error(err);
		  }
		}
	  });

	command.hear('8', async (context) => {
		const vkUserId = context.senderId;
		if (context.messagePayload.command === 'eight') { 
		  teamNumber = 8;
		  context.session.teamNumber = 8;
		  try {
			const team = await Team.findOne({ teamNumber: teamNumber }).exec();
			if (team) {
			  oldPositionValue = team.position;
			}
	  
			const admin = await Admin.findOne({ vkUserId: vkUserId }).exec();
			if (admin) {
			  newPositionValue = admin.station;
			}
	  
			const updatedTeam = await Team.findOneAndUpdate(
			  { teamNumber: teamNumber },
			  { $set: { position: newPositionValue } },
			  { new: true }
			).exec();
	  
			await context.send({
			  keyboard: JSON.stringify(keyboardScore),
			  message: 'Какое количество баллов начислить?',
			});
		  } catch (err) {
			console.error(err);
		  }
		}
	  });

	command.hear('9', async (context) => {
		const vkUserId = context.senderId;
		if (context.messagePayload.command === 'nine') { 
		  teamNumber = 9;
		  context.session.teamNumber = 9;
		  try {
			const team = await Team.findOne({ teamNumber: teamNumber }).exec();
			if (team) {
			  oldPositionValue = team.position;
			}
	  
			const admin = await Admin.findOne({ vkUserId: vkUserId }).exec();
			if (admin) {
			  newPositionValue = admin.station;
			}
	  
			const updatedTeam = await Team.findOneAndUpdate(
			  { teamNumber: teamNumber },
			  { $set: { position: newPositionValue } },
			  { new: true }
			).exec();
	  
			await context.send({
			  keyboard: JSON.stringify(keyboardScore),
			  message: 'Какое количество баллов начислить?',
			});
		  } catch (err) {
			console.error(err);
		  }
		}
	  });

	command.hear('10', async (context) => {
		const vkUserId = context.senderId;
		if (context.messagePayload.command === 'ten') { 
		  teamNumber = 10;
		  context.session.teamNumber = 10;
		  try {
			const team = await Team.findOne({ teamNumber: teamNumber }).exec();
			if (team) {
			  oldPositionValue = team.position;
			}
	  
			const admin = await Admin.findOne({ vkUserId: vkUserId }).exec();
			if (admin) {
			  newPositionValue = admin.station;
			}
	  
			const updatedTeam = await Team.findOneAndUpdate(
			  { teamNumber: teamNumber },
			  { $set: { position: newPositionValue } },
			  { new: true }
			).exec();
	  
			await context.send({
			  keyboard: JSON.stringify(keyboardScore),
			  message: 'Какое количество баллов начислить?',
			});
		  } catch (err) {
			console.error(err);
		  }
		}
	  });

	command.hear('11', async (context) => {
		const vkUserId = context.senderId;
		if (context.messagePayload.command === 'eleven') { 
		  teamNumber = 11;
		  context.session.teamNumber = 11;
		  try {
			const team = await Team.findOne({ teamNumber: teamNumber }).exec();
			if (team) {
			  oldPositionValue = team.position;
			}
	  
			const admin = await Admin.findOne({ vkUserId: vkUserId }).exec();
			if (admin) {
			  newPositionValue = admin.station;
			}
	  
			const updatedTeam = await Team.findOneAndUpdate(
			  { teamNumber: teamNumber },
			  { $set: { position: newPositionValue } },
			  { new: true }
			).exec();
	  
			await context.send({
			  keyboard: JSON.stringify(keyboardScore),
			  message: 'Какое количество баллов начислить?',
			});
		  } catch (err) {
			console.error(err);
		  }
		}
	  });

	command.hear('1 балл', async (context) => { 
		if (context.messagePayload.command === 'one point') {
			number = 1;
			const teamNumber = context.session.teamNumber;
			team = await Team.findOne({ teamNumber: teamNumber })
			team.score += number;
			await team.save();
			const station = newPositionValue; 
			const state = await State.findOne({ station }).exec();

if (!state) {
  const newStateData = {
    station,
    [`team${teamNumber}`]: number,
  };
  
  const newState = new State(newStateData);
  await newState.save();
} else {
  if (typeof state[`team${teamNumber}`] === 'number' && !isNaN(state[`team${teamNumber}`])) {
    state[`team${teamNumber}`] += number;
  } else {
    state[`team${teamNumber}`] = number;
  }
  
  await state.save();
}

await context.send({
  keyboard: JSON.stringify(keyboardAdmin),
  message: 'Начислено',
});

			for (const member of team.members) {
			const fixik =
				await User.findOne({
					_id: member,
				});
			await context.send({
				user_id: fixik.vkUserId,
				message: `Баллы команды: ${team.score}`,
			});
			}
		}
	});	

	command.hear('2 баллa', async (context) => { 
		if (context.messagePayload.command === 'two points') {
			number = 2;
			const teamNumber = context.session.teamNumber;
			team = await Team.findOne({ teamNumber: teamNumber })
			team.score += number;
			await team.save();
			const station = newPositionValue; 
			const state = await State.findOne({ station }).exec();

if (!state) {
  const newStateData = {
    station,
    [`team${teamNumber}`]: number,
  };
  
  const newState = new State(newStateData);
  await newState.save();
} else {
  if (typeof state[`team${teamNumber}`] === 'number' && !isNaN(state[`team${teamNumber}`])) {
    state[`team${teamNumber}`] += number;
  } else {
    state[`team${teamNumber}`] = number;
  }
  
  await state.save();
}

await context.send({
  keyboard: JSON.stringify(keyboardAdmin),
  message: 'Начислено',
});

			for (const member of team.members) {
			const fixik =
				await User.findOne({
					_id: member,
				});
			await context.send({
				user_id: fixik.vkUserId,
				message: `Баллы команды: ${team.score}`,
			});
			}
		}
	});	
	command.hear('3 балла', async (context) => { 
		if (context.messagePayload.command === 'three points') {
			number = 3;
			const teamNumber = context.session.teamNumber;
			team = await Team.findOne({ teamNumber: teamNumber })
			team.score += number;
			await team.save();
			const station = newPositionValue; 
			const state = await State.findOne({ station }).exec();

if (!state) {
  const newStateData = {
    station,
    [`team${teamNumber}`]: number,
  };
  
  const newState = new State(newStateData);
  await newState.save();
} else {
  if (typeof state[`team${teamNumber}`] === 'number' && !isNaN(state[`team${teamNumber}`])) {
    state[`team${teamNumber}`] += number;
  } else {
    state[`team${teamNumber}`] = number;
  }
  
  await state.save();
}

await context.send({
  keyboard: JSON.stringify(keyboardAdmin),
  message: 'Начислено',
});

			for (const member of team.members) {
			const fixik =
				await User.findOne({
					_id: member,
				});
			await context.send({
				user_id: fixik.vkUserId,
				message: `Баллы команды: ${team.score}`,
			});
			}
		}
	});	
	command.hear('4 балла', async (context) => { 
		if (context.messagePayload.command === 'four points') {
			number = 4;
			const teamNumber = context.session.teamNumber;
			team = await Team.findOne({ teamNumber: teamNumber })
			team.score += number;
			await team.save();
			const station = newPositionValue; 
			const state = await State.findOne({ station }).exec();

if (!state) {
  const newStateData = {
    station,
    [`team${teamNumber}`]: number,
  };
  
  const newState = new State(newStateData);
  await newState.save();
} else {
  if (typeof state[`team${teamNumber}`] === 'number' && !isNaN(state[`team${teamNumber}`])) {
    state[`team${teamNumber}`] += number;
  } else {
    state[`team${teamNumber}`] = number;
  }
  
  await state.save();
}

await context.send({
  keyboard: JSON.stringify(keyboardAdmin),
  message: 'Начислено',
});

			for (const member of team.members) {
			const fixik =
				await User.findOne({
					_id: member,
				});
			await context.send({
				user_id: fixik.vkUserId,
				message: `Баллы команды: ${team.score}`,
			});
			}
		}
	});	
	command.hear('5 баллов', async (context) => { 
		if (context.messagePayload.command === 'five points') {
			number = 5;
			const teamNumber = context.session.teamNumber;
			team = await Team.findOne({ teamNumber: teamNumber })
			team.score += number;
			await team.save();
			const station = newPositionValue; 
			const state = await State.findOne({ station }).exec();

if (!state) {
  // если не найдено, создать новое состояние
  const newStateData = {
    station,
    [`team${teamNumber}`]: number,
  };
  
  const newState = new State(newStateData);
  await newState.save();
} else {
  // проверить, что поле team${teamNumber} числовое
  if (typeof state[`team${teamNumber}`] === 'number' && !isNaN(state[`team${teamNumber}`])) {
    state[`team${teamNumber}`] += number;
  } else {
    // если поле не является числом или NaN
    state[`team${teamNumber}`] = number;
  }
  
  await state.save();
}

await context.send({
  keyboard: JSON.stringify(keyboardAdmin),
  message: 'Начислено',
});

			for (const member of team.members) {
			const fixik =
				await User.findOne({
					_id: member,
				});
			await context.send({
				user_id: fixik.vkUserId,
				message: `Баллы команды: ${team.score}`,
			});
			}
		}
	});	
}

  //----------------------------------- АДМИНКА -------------------------------------------------

  //----------------------------------- НЕ админка -------------------------------------------------

  if (!userAdmin) {
    const keyboard = {
      inline: false,
      buttons: [
        [
          createButton("Карта", "map"),
          createButton("Моя команда", "send_team_info"),
        ],
        [
          createButton("Я потерялся", "lost"),
          createButton("Маршрут", "route"),
        ],
      ],
    };
    const keyboardJSON = JSON.stringify(keyboard);
//распределение по командам---------------------------------------------------------------
    let user = await User.findOne({ vkUserId });
    if (!user) {
      let user = await User.create({
        vkUserId,
        userNumber: currentUserNumber,
      });
      currentUserNumber++;
      let teamNumber = (lastAssignedTeamNumber % 11) + 1;

      try {
        let team = await Team.findOne({ teamNumber });
        if (!team) {
          team = await Team.create({
            teamNumber,
            members: [user], 
          });
        } else {
          if (team.members.length < 7) {
            team.members.push(user);
            await team.save();
            console.log(`Пользователь добавлен в команду ${teamNumber}`);
          } else {
            console.log(
              `Нельзя добавить пользователя в команду ${teamNumber}, так как она уже содержит 7 участников.`
            );
          }
        }

        lastAssignedTeamNumber = teamNumber; 
      } catch (error) {
        console.error("Ошибка при обновлении данных:", error);
      }
      await context.send(
        `Добро пожаловать! Твоя команда: ${teamNumber}. Если возникнет какая-то проблема, обращайся к модераторам. `
      );
    }
    await context.send({
      message: "Выбери действие:",
      keyboard: keyboardJSON,
    });
//распределение по командам---------------------------------------------------------------

    // обработчик команды "Карта"
    command.hear(['карта', 'Карта'], async (context) => {
      const attachment = await upload.messagePhoto({
        source: {
          values: [
            {
              value: "./map.jpeg",
              contentType: "image/jpeg",
            },
          ],
        },
      });

      await context.send({
        message: "Карта:",
        attachment: attachment,
      });
    });

    // обработчик команды "Моя команда"
    command.hear(['моя команда', 'Моя команда'], async (context) => {
	const vkUserId = context.senderId;
      const user = await User.findOne({ vkUserId });
      if (!user) {
        await context.send("Ты не зарегистрирован в команде.");
      } else {
        if (!user._id) {
          await context.send("Ты не стартовал.");
        } else {
          const team = await Team.findOne({
            members: user._id,
          }).populate("members");

          if (!team) {
            await context.send("Твоя команда не найдена.");
          } else {
            const teamNum = team.teamNumber;

            // получаем информацию о пользователях в команде (имя и фамилию)
            const teamMembersInfo = await Promise.all(
              team.members.map(async (member) => {
                const userProfile = await vk.api.users.get({
                  user_ids: member.vkUserId.toString(),
                  fields: "screen_name,first_name,last_name", // запрашиваем имя, фамилию и ссылку
                });

                // формируем информацию о пользователе в формате "Имя Фамилия (@ссылка)"
                const userInfo = `${userProfile[0].first_name} ${userProfile[0].last_name} (@${userProfile[0].screen_name})`;

                return userInfo;
              })
            );

            await context.send(
              `Номер команды: ${teamNum}\nСостав команды:\n${teamMembersInfo.join(
                "\n"
              )}`
            );
          }
        }
      }
    });

    // обработчик команды "Я потерялся"
    command.hear(['я потерялся', 'Я потерялся'], async (context) => {
      const vkUserId = context.senderId;
      const user = await User.findOne({ vkUserId });
      const team = await Team.findOne({ members: user._id }).populate(
        "members"
      );
      const position = team.position;
	  if (position == 0) {
		context.send('Твоя команда идёт на станцию, повтори запрос через несколько минут!')}
		else {
      await context.send(`Твоя команда находится на станции: ${position}`);}
    });

  // обработчик команды "Маршрут"
command.hear(['маршрут', 'Маршрут'], async (context) => {
	try {
	  const vkUserId = context.senderId;
	  const user = await User.findOne({ vkUserId });
  
	  if (!user) {
		await context.send("Ты не зарегистрирован в команде.");
	  } else {
		const team = await Team.findOne({ members: user._id }).populate(
		  "members"
		);
		const teamNumber = team.teamNumber;
  
		const route = await Route.findOne({ teamNumber: teamNumber });
  
		if (route) {
		  const routeText = route.route;
		  await context.send(
			`Маршрут для твоей команды (${teamNumber}):\n${routeText}`
		  );
		} else {
		  await context.send("Маршрут для твоей команды не найден.");
		}
	  }
	} catch (error) {
	  console.error('Произошла ошибка при обработке команды "Маршрут":', error);
	  await context.send('Произошла ошибка при обработке команды "Маршрут".');
	}
  });  
}

});


//-----------------------------------  НЕ админка -------------------------------------------------
mongoose.connection.on("error", (error) => {
  console.error("MongoDB connection error:", error);
});

mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB");
});

// запуск бота
vk.updates.startPolling();
