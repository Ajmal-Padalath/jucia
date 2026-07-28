import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const FOOD_IMAGES: Record<string, string> = {
  starters: "https://images.unsplash.com/photo-1541014741259-de529411b96a?w=800&q=80",
  soups: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80",
  "main-course": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
  pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80",
  burgers: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
  drinks: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&q=80",
  desserts: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80",
};

async function main() {
  console.log("Seeding database...");

  await prisma.feedback.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.extra.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.foodItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.qRCode.deleteMany();
  await prisma.table.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.restaurant.deleteMany();

  const restaurant = await prisma.restaurant.create({
    data: {
      name: "Orange Flame Kitchen",
      logo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&q=80",
      description: "Modern dining with farm-fresh ingredients and bold flavors.",
      address: "123 Culinary Avenue, Foodie District",
      phone: "+1 555 0100",
      email: "hello@orangeflame.com",
      taxRate: 0.05,
      serviceRate: 0.1,
      currency: "USD",
    },
  });

  const password = await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", 10);

  await prisma.user.createMany({
    data: [
      {
        name: "Admin User",
        email: process.env.ADMIN_EMAIL || "admin@restaurant.com",
        password,
        role: Role.ADMIN,
        restaurantId: restaurant.id,
      },
      {
        name: "Kitchen Chef",
        email: "kitchen@restaurant.com",
        password,
        role: Role.KITCHEN,
        restaurantId: restaurant.id,
      },
      {
        name: "Waiter Staff",
        email: "waiter@restaurant.com",
        password,
        role: Role.WAITER,
        restaurantId: restaurant.id,
      },
    ],
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  for (let i = 1; i <= 12; i++) {
    await prisma.table.create({
      data: {
        number: i,
        capacity: i <= 4 ? 2 : i <= 8 ? 4 : 6,
        restaurantId: restaurant.id,
        qrCode: {
          create: {
            restaurantId: restaurant.id,
            url: `${appUrl}/menu?table=${i}`,
          },
        },
      },
    });
  }

  const categoryData = [
    { name: "Starters", slug: "starters", sortOrder: 1 },
    { name: "Soups", slug: "soups", sortOrder: 2 },
    { name: "Main Course", slug: "main-course", sortOrder: 3 },
    { name: "Pizza", slug: "pizza", sortOrder: 4 },
    { name: "Burgers", slug: "burgers", sortOrder: 5 },
    { name: "Drinks", slug: "drinks", sortOrder: 6 },
    { name: "Desserts", slug: "desserts", sortOrder: 7 },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoryData) {
    const created = await prisma.category.create({
      data: {
        ...cat,
        image: FOOD_IMAGES[cat.slug],
        restaurantId: restaurant.id,
      },
    });
    categories[cat.slug] = created.id;
  }

  const menuItems = [
    {
      name: "Crispy Calamari",
      slug: "crispy-calamari",
      description: "Golden fried calamari rings with lemon aioli and chili dust.",
      price: 12.99,
      category: "starters",
      isVeg: false,
      prepTime: 12,
      isFeatured: true,
      isPopular: true,
      ingredients: JSON.stringify(["calamari", "flour", "lemon", "aioli"]),
      variants: [
        { name: "Regular", price: 12.99 },
        { name: "Large", price: 16.99 },
      ],
      extras: [
        { name: "Extra aioli", price: 1.5 },
        { name: "Spicy dip", price: 1.0 },
      ],
    },
    {
      name: "Bruschetta Trio",
      slug: "bruschetta-trio",
      description: "Toasted sourdough with tomato basil, mushroom, and avocado toppings.",
      price: 9.99,
      category: "starters",
      isVeg: true,
      prepTime: 10,
      isFeatured: true,
      ingredients: JSON.stringify(["sourdough", "tomato", "basil", "mushroom", "avocado"]),
    },
    {
      name: "Tomato Basil Soup",
      slug: "tomato-basil-soup",
      description: "Silky roasted tomato soup finished with fresh basil oil.",
      price: 7.5,
      category: "soups",
      isVeg: true,
      prepTime: 8,
      isPopular: true,
      ingredients: JSON.stringify(["tomato", "basil", "cream", "garlic"]),
    },
    {
      name: "Chicken Noodle Soup",
      slug: "chicken-noodle-soup",
      description: "Comforting broth with tender chicken, egg noodles, and herbs.",
      price: 8.5,
      category: "soups",
      isVeg: false,
      prepTime: 10,
      ingredients: JSON.stringify(["chicken", "noodles", "carrot", "celery"]),
    },
    {
      name: "Grilled Salmon",
      slug: "grilled-salmon",
      description: "Atlantic salmon with citrus butter, asparagus, and herb rice.",
      price: 24.99,
      category: "main-course",
      isVeg: false,
      prepTime: 22,
      isFeatured: true,
      isPopular: true,
      ingredients: JSON.stringify(["salmon", "asparagus", "rice", "butter"]),
      variants: [
        { name: "Regular", price: 24.99 },
        { name: "With lobster sauce", price: 29.99 },
      ],
    },
    {
      name: "Paneer Tikka Masala",
      slug: "paneer-tikka-masala",
      description: "Charred cottage cheese in a rich tomato-cashew gravy.",
      price: 16.99,
      category: "main-course",
      isVeg: true,
      prepTime: 20,
      isPopular: true,
      ingredients: JSON.stringify(["paneer", "tomato", "cashew", "spices"]),
      extras: [
        { name: "Butter naan", price: 2.5 },
        { name: "Jeera rice", price: 3.0 },
      ],
    },
    {
      name: "Margherita Pizza",
      slug: "margherita-pizza",
      description: "San Marzano tomato, fresh mozzarella, and basil on wood-fired crust.",
      price: 14.99,
      category: "pizza",
      isVeg: true,
      prepTime: 18,
      isFeatured: true,
      isPopular: true,
      ingredients: JSON.stringify(["dough", "tomato", "mozzarella", "basil"]),
      variants: [
        { name: "Small", price: 12.99 },
        { name: "Medium", price: 14.99 },
        { name: "Large", price: 18.99 },
      ],
      extras: [
        { name: "Extra cheese", price: 2.0 },
        { name: "Olives", price: 1.5 },
        { name: "Mushrooms", price: 1.5 },
      ],
    },
    {
      name: "Pepperoni Feast",
      slug: "pepperoni-feast",
      description: "Loaded pepperoni pizza with smoked mozzarella and chili oil.",
      price: 17.99,
      category: "pizza",
      isVeg: false,
      prepTime: 18,
      isPopular: true,
      ingredients: JSON.stringify(["dough", "pepperoni", "mozzarella", "chili"]),
      variants: [
        { name: "Medium", price: 17.99 },
        { name: "Large", price: 21.99 },
      ],
    },
    {
      name: "Classic Cheeseburger",
      slug: "classic-cheeseburger",
      description: "Angus beef patty, cheddar, pickles, and house sauce on brioche.",
      price: 13.99,
      category: "burgers",
      isVeg: false,
      prepTime: 15,
      isFeatured: true,
      isPopular: true,
      ingredients: JSON.stringify(["beef", "cheddar", "brioche", "pickles"]),
      variants: [
        { name: "Single", price: 13.99 },
        { name: "Double", price: 17.99 },
      ],
      extras: [
        { name: "Bacon", price: 2.0 },
        { name: "Avocado", price: 1.5 },
        { name: "Fried egg", price: 1.5 },
      ],
    },
    {
      name: "Veggie Supreme Burger",
      slug: "veggie-supreme-burger",
      description: "Plant-based patty with grilled peppers, lettuce, and vegan aioli.",
      price: 12.99,
      category: "burgers",
      isVeg: true,
      prepTime: 14,
      ingredients: JSON.stringify(["plant patty", "peppers", "lettuce", "aioli"]),
    },
    {
      name: "Fresh Lime Soda",
      slug: "fresh-lime-soda",
      description: "Sparkling lime cooler with mint and a hint of sea salt.",
      price: 4.5,
      category: "drinks",
      isVeg: true,
      prepTime: 5,
      isPopular: true,
      ingredients: JSON.stringify(["lime", "soda", "mint"]),
    },
    {
      name: "Iced Cold Brew",
      slug: "iced-cold-brew",
      description: "Slow-steeped cold brew coffee over ice with optional vanilla.",
      price: 5.5,
      category: "drinks",
      isVeg: true,
      prepTime: 4,
      ingredients: JSON.stringify(["coffee", "ice"]),
      extras: [{ name: "Vanilla syrup", price: 0.75 }],
    },
    {
      name: "Chocolate Lava Cake",
      slug: "chocolate-lava-cake",
      description: "Warm molten chocolate cake with vanilla ice cream.",
      price: 9.99,
      category: "desserts",
      isVeg: true,
      prepTime: 12,
      isFeatured: true,
      isPopular: true,
      ingredients: JSON.stringify(["chocolate", "flour", "butter", "ice cream"]),
    },
    {
      name: "Berry Cheesecake",
      slug: "berry-cheesecake",
      description: "Creamy New York style cheesecake topped with seasonal berries.",
      price: 8.99,
      category: "desserts",
      isVeg: true,
      prepTime: 5,
      ingredients: JSON.stringify(["cream cheese", "berries", "biscuit"]),
    },
  ];

  for (const item of menuItems) {
    const { category, variants, extras, ...data } = item;
    await prisma.foodItem.create({
      data: {
        ...data,
        image: FOOD_IMAGES[category],
        rating: 4.2 + Math.random() * 0.7,
        categoryId: categories[category],
        restaurantId: restaurant.id,
        variants: variants ? { create: variants } : undefined,
        extras: extras ? { create: extras } : undefined,
      },
    });
  }

  await prisma.coupon.createMany({
    data: [
      {
        code: "WELCOME10",
        description: "10% off your first order",
        discountType: "PERCENT",
        discountValue: 10,
        minOrder: 20,
        restaurantId: restaurant.id,
      },
      {
        code: "FLAT5",
        description: "$5 off orders over $30",
        discountType: "FIXED",
        discountValue: 5,
        minOrder: 30,
        restaurantId: restaurant.id,
      },
    ],
  });

  console.log("Seed completed successfully!");
  console.log("Admin: admin@restaurant.com / admin123");
  console.log("Kitchen: kitchen@restaurant.com / admin123");
  console.log("Waiter: waiter@restaurant.com / admin123");
  console.log("Customer menu: /menu?table=1");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
