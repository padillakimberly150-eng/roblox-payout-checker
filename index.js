
const express = require("express");

const app = express();
app.use(express.json());

const GROUPS = [
  { name: "Vivid Vouge", id: 35546647 }
];

app.get("/", (req, res) => {
  res.send("Roblox Payout Checker is online!");
});

app.get("/check/:username", async (req, res) => {
  try {
    const username = req.params.username;

    // Find Roblox user
    const userResponse = await fetch(
      "https://users.roblox.com/v1/usernames/users",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernames: [username],
          excludeBannedUsers: true
        })
      }
    );

    if (!userResponse.ok) {
      throw new Error("Roblox username lookup failed");
    }

    const userData = await userResponse.json();
    const user = userData.data?.[0];

    if (!user) {
      return res.status(404).json({
        error: "Roblox username not found"
      });
    }

    // Get user's groups
    const groupResponse = await fetch(
      `https://groups.roblox.com/v2/users/${user.id}/groups/roles`
    );

    if (!groupResponse.ok) {
      throw new Error("Roblox group lookup failed");
    }

    const groupData = await groupResponse.json();
    const userGroups = groupData.data || [];

    const results = GROUPS.map(group => {
      const membership = userGroups.find(
        item => item.group.id === group.id
      );

      return {
        name: group.name,
        groupId: group.id,
        eligible: Boolean(membership),
        status: membership ? "Eligible" : "Not Eligible"
      };
    });

    const count = results.filter(g => g.eligible).length;

    res.json({
      username: user.name,
      userId: user.id,
      groups: results,
      total: `${count}/${GROUPS.length}`
    });

  } catch (error) {
    res.status(500).json({
      error: "Unable to check Roblox membership"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Checker running on port ${PORT}`);
});
